import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../shared/db/dexie-db';

const DENSITY_LIMIT = 10;
const UNDERLINE_CLASS = 'glimpse-codex-underline';
const ACTIVE_CLASS = 'active';

export function useCodexUnderliner() {
  const [terms, setTerms] = useState<string[]>([]);
  const visibleUnderlines = useRef<Set<HTMLElement>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      const allEntries = await db.userScrapbook.toArray();
      setTerms(allEntries.map(e => e.term));
    };
    fetchTerms();
  }, []);

  const updateUnderlineStyles = useCallback(() => {
    const allVisible = Array.from(visibleUnderlines.current);
    const underlinesToActivate = allVisible.slice(0, DENSITY_LIMIT);
    
    // Deactivate all first (or just the ones that should be inactive)
    document.querySelectorAll(`.${UNDERLINE_CLASS}`).forEach(el => {
      el.classList.remove(ACTIVE_CLASS);
    });

    // Activate the top N
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

  const scanDocument = useCallback(() => {
    if (terms.length === 0) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
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

    const termRegex = new RegExp(`\\b(${terms.map(t => escapeRegExp(t)).join('|')})\\b`, 'gi');

    while ((currentNode = walker.nextNode())) {
      const textNode = currentNode as Text;
      const content = textNode.nodeValue || '';
      const matches: { term: string; index: number }[] = [];
      let match;
      
      while ((match = termRegex.exec(content)) !== null) {
        matches.push({ term: match[0], index: match.index });
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
        // Text before match
        fragment.appendChild(document.createTextNode(content.substring(lastIndex, index)));
        
        // Match wrapped in span
        const span = document.createElement('span');
        span.className = UNDERLINE_CLASS;
        span.textContent = term;
        // Finding: Store metadata for tooltip later
        span.dataset.term = term;
        fragment.appendChild(span);
        
        lastIndex = index + term.length;
      });

      // Remaining text
      fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
      node.parentNode?.replaceChild(fragment, node);
    });

    if (nodesToReplace.length > 0) {
      setupObserver();
    }
  }, [terms, setupObserver]);

  useEffect(() => {
    scanDocument();
  }, [scanDocument]);

  return { scanDocument };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
