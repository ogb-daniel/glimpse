import { useState, useEffect } from 'react';
import {
  checkAiCapabilities,
  AiCapabilityStatus,
} from '@/shared/utils/ai-health-service';

const STORAGE_KEY_ENABLED = 'glimpse_enabled';

function App() {
  const [enabled, setEnabled] = useState(true);
  const [aiStatus, setAiStatus] = useState<AiCapabilityStatus | 'checking'>('checking');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Load persisted toggle state
      const stored = await browser.storage.local.get(STORAGE_KEY_ENABLED);
      const isEnabled = stored[STORAGE_KEY_ENABLED] !== false; // default true
      setEnabled(isEnabled);

      // Check AI health
      const result = await checkAiCapabilities();
      if (result.success) {
        setAiStatus(result.data.available);
      } else {
        setAiStatus('unavailable');
      }

      setLoaded(true);
    };
    init();
  }, []);

  const handleToggle = async () => {
    const newState = !enabled;
    setEnabled(newState);
    await browser.storage.local.set({ [STORAGE_KEY_ENABLED]: newState });
    // Notify all content scripts of the state change
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, {
          type: 'GLIMPSE_TOGGLE',
          payload: { enabled: newState },
        }).catch(() => {
          // Tab might not have content script loaded — that's fine
        });
      }
    }
  };

  const getStatusDot = () => {
    if (!loaded) return { color: '#9AA0A6', label: 'Loading...' };
    if (!enabled) return { color: '#9AA0A6', label: 'Disabled' };
    if (aiStatus === 'available') return { color: '#34A853', label: 'Active' };
    if (aiStatus === 'checking') return { color: '#FBBC04', label: 'Checking...' };
    if (aiStatus === 'downloadable' || aiStatus === 'downloading')
      return { color: '#FBBC04', label: 'Preparing...' };
    return { color: '#EA4335', label: 'Unavailable' };
  };

  const status = getStatusDot();

  return (
    <div
      style={{
        width: '300px',
        padding: '0',
        margin: '0',
        fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
        backgroundColor: 'var(--surface-base, #FFFFFF)',
        color: 'var(--ink-primary, #202124)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          background: 'linear-gradient(135deg, #F8F7F4 0%, #EDECEA 100%)',
          borderBottom: '1px solid var(--border-hairline, rgba(0,0,0,0.1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.3px',
                color: 'var(--accent-gold-hc, #635F4B)',
              }}
            >
              Glimpse
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-gold-soft, #F0F0E8)',
                color: 'var(--accent-gold-hc, #635F4B)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Beta
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            aria-label={enabled ? 'Disable Glimpse' : 'Enable Glimpse'}
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: enabled ? '#34A853' : '#DADCE0',
              transition: 'background-color 0.2s ease',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: enabled ? '23px' : '3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease',
              }}
            />
          </button>
        </div>

        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: 'var(--ink-secondary, #5F6368)',
            lineHeight: '1.4',
          }}
        >
          Privacy-first, local-AI learning companion.
        </p>
      </div>

      {/* Status Section */}
      <div style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-raised, #F4F4F2)',
            border: '1px solid var(--border-hairline, rgba(0,0,0,0.06))',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status.color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${status.color}40`,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            Local AI: {status.label}
          </span>
        </div>

        {/* Quick Tips */}
        <div style={{ marginTop: '16px' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ink-secondary, #5F6368)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 8px 0',
            }}
          >
            How to use
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', lineHeight: '1.4' }}>
              <span style={{ flexShrink: 0 }}>1.</span>
              <span style={{ color: 'var(--ink-secondary, #5F6368)' }}>
                Highlight any text on a webpage.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', lineHeight: '1.4' }}>
              <span style={{ flexShrink: 0 }}>2.</span>
              <span style={{ color: 'var(--ink-secondary, #5F6368)' }}>
                Hold your mouse button for 1.5s.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', lineHeight: '1.4' }}>
              <span style={{ flexShrink: 0 }}>3.</span>
              <span style={{ color: 'var(--ink-secondary, #5F6368)' }}>
                Get an instant, private explanation.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-hairline, rgba(0,0,0,0.06))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--ink-secondary, #9AA0A6)',
          }}
        >
          All data stays on your device.
        </span>
        <button
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') })}
          style={{
            fontSize: '11px',
            color: 'var(--accent-gold-hc, #635F4B)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--accent-gold-soft, #F0F0E8)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          Setup Guide
        </button>
      </div>
    </div>
  );
}

export default App;
