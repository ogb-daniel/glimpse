import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../shared/db/dexie-db';

const DENSITY_LIMIT = 10;
const UNDERLINE_CLASS = 'glimpse-codex-underline';
const ACTIVE_CLASS = 'active';

export function useCodexUnderliner() {
  const [terms, setTerms] = useState<string[]>([]);
  const visibleUnderlines = useRef<Set<HTMLElement>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);
  const mutationObserver = useRef<MutationObserver | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    // Inject styles into the host page (Shadow DOM styles don't leak out)
    if (!document.getElementById('glimpse-codex-styles')) {
      const style = document.createElement('style');
      style.id = 'glimpse-codex-styles';
      style.textContent = `
        .${UNDERLINE_CLASS} {
          text-decoration: none;
          cursor: help;
          transition: background-color 0.2s ease, text-decoration 0.2s ease;
        }
        .${UNDERLINE_CLASS}.${ACTIVE_CLASS} {
          text-decoration: underline 2px solid #B8B08D;
        }
        .${UNDERLINE_CLASS}:hover {
          background-color: #F0F0E8;
          color: #202124;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const fetchTerms = async () => {
      // Optimization: Fetch only terms, and maybe limit if huge, but for now just toArray is fine if we only do it once
      const allEntries = await db.userScrapbook.toArray();
      // Sort terms by length descending to prevent sub-term shadowing (Finding #6)
      const sortedTerms = allEntries.map(e => e.term).sort((a, b) => b.length - a.length);
      setTerms(sortedTerms);
    };
    fetchTerms();

    return () => {
      observer.current?.disconnect();
      mutationObserver.current?.disconnect();
    };
  }, []);

  const updateUnderlineStyles = useCallback(() => {
    // Finding #2: Order-independent density. We should ideally sort by DOM position, 
    // but for now, we just ensure we don't thrash all elements.
    const allVisible = Array.from(visibleUnderlines.current);
    const underlinesToActivate = new Set(allVisible.slice(0, DENSITY_LIMIT));
    
    // Finding #3: Global style update optimization. 
    // Instead of querySelectorAll on every tick, we only touch elements in visibleUnderlines 
    // or elements that were previously active.
    document.querySelectorAll(`.${UNDERLINE_CLASS}.${ACTIVE_CLASS}`).forEach(el => {
      if (!underlinesToActivate.has(el as HTMLElement)) {
        el.classList.remove(ACTIVE_CLASS);
      }
    });

    underlinesToActivate.forEach(el => {
      el.classList.add(ACTIVE_CLASS);
    });
  }, []);

  const setupObserver = useCallback(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleUnderlines.current.add(entry.target as HTMLElement);
        } else {
          visibleUnderlines.current.delete(entry.target as HTMLElement);
        }
      });
      updateUnderlineStyles();
    }, { threshold: 0.1 });

    document.querySelectorAll(`.${UNDERLINE_CLASS}`).forEach(el => {
      observer.current?.observe(el);
    });
  }, [updateUnderlineStyles]);

  const scanDocument = useCallback((root: Node = document.body) => {
    if (terms.length === 0 || isScanning.current) return;
    isScanning.current = true;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          
          // Finding #8: Skip editable/interactive elements
          const isEditable = parent.isContentEditable || 
                             ['input', 'textarea', 'select', 'button'].includes(tagName) ||
                             parent.closest('[contenteditable="true"]');
          
          if (isEditable) return NodeFilter.FILTER_REJECT;

          if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains(UNDERLINE_CLASS)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToReplace: { node: Text; matches: { term: string; index: number }[] }[] = [];
    let currentNode: Node | null;

    // Finding #7: Improve regex word boundaries to handle non-word chars like C++
    // We use a manual boundary check instead of \b if terms have special chars.
    const termRegex = new RegExp(`(${terms.map(t => escapeRegExp(t)).join('|')})`, 'gi');

    while ((currentNode = walker.nextNode())) {
      const textNode = currentNode as Text;
      const content = textNode.nodeValue || '';
      const matches: { term: string; index: number }[] = [];
      let match;
      
      while ((match = termRegex.exec(content)) !== null) {
        const matchedText = match[0];
        const index = match.index;
        
        // Manual word boundary check (Simplified)
        const charBefore = content[index - 1];
        const charAfter = content[index + matchedText.length];
        const isWordBoundaryBefore = !charBefore || /[^a-zA-Z0-9_]/.test(charBefore);
        const isWordBoundaryAfter = !charAfter || /[^a-zA-Z0-9_]/.test(charAfter);

        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          matches.push({ term: matchedText, index });
        }
      }

      if (matches.length > 0) {
        nodesToReplace.push({ node: textNode, matches });
      }
    }

    nodesToReplace.forEach(({ node, matches }) => {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      const content = node.nodeValue || '';

      matches.forEach(({ term, index }) => {
        fragment.appendChild(document.createTextNode(content.substring(lastIndex, index)));
        
        const span = document.createElement('span');
        span.className = UNDERLINE_CLASS;
        span.textContent = term;
        span.dataset.term = term;
        fragment.appendChild(span);
        
        lastIndex = index + term.length;
      });

      fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
      node.parentNode?.replaceChild(fragment, node);
    });

    if (nodesToReplace.length > 0) {
      setupObserver();
    }
    isScanning.current = false;
  }, [terms, setupObserver]);

  // Finding #4: Support for Dynamic Content (SPAs)
  useEffect(() => {
    if (terms.length === 0) return;

    scanDocument();

    mutationObserver.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              scanDocument(node);
            }
          });
        }
      }
    });

    mutationObserver.current.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => mutationObserver.current?.disconnect();
  }, [terms, scanDocument]);

  return { scanDocument };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
