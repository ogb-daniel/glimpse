import { useEffect, useState, useRef } from 'react';
import { checkAiCapabilities, AiCapabilityStatus } from '@/shared/utils/ai-health-service';
import { getOrCreateIdentity } from '@/shared/utils/identity-service';

function App() {
  const [aiStatus, setAiStatus] = useState<AiCapabilityStatus | 'checking'>('checking');
  const [identityReady, setIdentityReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const tutorialRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const [aiResult, idResult] = await Promise.all([
        checkAiCapabilities(),
        getOrCreateIdentity()
      ]);
      
      if (aiResult.success) {
        setAiStatus(aiResult.data.available);
      } else {
        setAiStatus('no');
      }

      if (idResult.success) {
        setIdentityReady(true);
      }
    };
    initialize();
  }, []);

  // Simplified hold listener for tutorial
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Finding 10: Check for left-click only
      if (e.button !== 0) return;

      // Finding 2: Scope to the specific "test" area
      if (!tutorialRef.current?.contains(e.target as Node)) return;

      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        // Finding 1: Clear previous timer if it exists (Resource Leak)
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          // Finding 11: Re-verify selection status at the end of timeout
          const currentSelection = window.getSelection();
          if (currentSelection && currentSelection.toString().trim().length > 0) {
            setOnboarded(true);
          }
          timerRef.current = null;
        }, 1500);
      }
    };

    const handleMouseUp = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      // Finding 1: Proper cleanup of listeners and timers (Resource Leak)
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isSystemReady = identityReady && aiStatus === 'readily';

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '80px auto', 
      padding: '40px', 
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-popover)',
      backgroundColor: 'var(--surface-base)'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          color: 'var(--accent-gold-hc)', 
          fontSize: '32px',
          letterSpacing: '-0.5px',
          marginBottom: '8px'
        }}>
          Glimpse
        </h1>
        <div style={{ 
          width: '40px', 
          height: '2px', 
          backgroundColor: 'var(--accent-gold)', 
          margin: '0 auto' 
        }} />
      </header>

      <p className="text-serif" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        Your seamless learning partner is being initialized. Glimpse uses local-only AI (Gemini Nano) to provide privacy-first explanations of anything you read.
      </p>

      <section style={{ 
        marginTop: '40px', 
        padding: '24px', 
        backgroundColor: 'var(--surface-raised)', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-hairline)'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>System Health</h2>
        
        {/* Finding 9: Combined status indicator */}
        <div style={{ marginBottom: '16px' }}>
          {isSystemReady ? (
            <p style={{ color: 'green', fontSize: '15px', fontWeight: 'bold' }}>✅ System Ready: Local AI is active.</p>
          ) : (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '15px' }}>⏳ System Preparing...</p>
          )}
        </div>

        <div style={{ fontSize: '14px' }}>
          {identityReady ? (
            <p style={{ color: 'green', margin: '4px 0' }}>• Local Identity: Created and secure.</p>
          ) : (
            <p style={{ color: 'var(--ink-secondary)', margin: '4px 0' }}>• Initializing identity...</p>
          )}

          {/* Finding 3: Non-compliant status strings (AC#2) */}
          {aiStatus === 'checking' && (
            <p className="text-caption">• Checking AI capabilities...</p>
          )}
          {aiStatus === 'readily' && (
            <p style={{ color: 'green', margin: '4px 0' }}>• Hardware Support: Verified.</p>
          )}
          {aiStatus === 'after-download' && (
            <p style={{ color: 'var(--accent-gold-hc)', margin: '4px 0' }}>• System Preparing: Downloading local model...</p>
          )}
          {aiStatus === 'no' && (
            <div style={{ color: '#d93025', marginTop: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>❌ Hardware Not Supported</p>
              <p className="text-serif" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                Your current setup does not support built-in AI. To enable Glimpse, please follow these steps:
              </p>
              {/* Finding 5: Better instructions and clickable links where possible */}
              <ul style={{ fontSize: '13px', lineHeight: '1.5', paddingLeft: '20px' }}>
                <li>Using Chrome 127+ (Dev/Canary recommended).</li>
                <li>Enable <a href="chrome://flags/#prompt-api-for-gemini-nano" onClick={(e) => { e.preventDefault(); browser.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' }); }}>#prompt-api-for-gemini-nano</a>.</li>
                <li>Enable <a href="chrome://flags/#optimization-guide-on-device-model" onClick={(e) => { e.preventDefault(); browser.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' }); }}>#optimization-guide-on-device-model</a> (set to "Enabled BypassPerfRequirement").</li>
                <li>Visit <a href="chrome://components" onClick={(e) => { e.preventDefault(); browser.tabs.create({ url: 'chrome://components' }); }}>chrome://components</a> and update "Optimization Guide On Device Model".</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Interactive Tutorial</h2>
        <p className="text-serif" style={{ marginBottom: '20px' }}>
          Try the <strong>Magic Hold</strong>. Highlight the sentence below and hold your mouse button down for 1.5 seconds.
        </p>
        
        <div 
          ref={tutorialRef}
          style={{ 
            padding: '32px', 
            border: '2px dashed var(--accent-gold)', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            userSelect: 'text',
            cursor: 'text',
            backgroundColor: onboarded ? 'var(--accent-gold-soft)' : 'transparent',
            transition: 'background-color 0.5s ease'
          }}>
          <p style={{ 
            fontSize: '18px', 
            fontStyle: 'italic', 
            margin: 0,
            color: onboarded ? 'var(--accent-gold-hc)' : 'inherit'
          }}>
            "The ephemeral nature of digital fragments requires a persistent observer to forge lasting knowledge."
          </p>
        </div>

        {onboarded && (
          <div style={{ 
            marginTop: '24px', 
            textAlign: 'center', 
            animation: 'fadeIn 0.5s ease-in'
          }}>
            <p style={{ color: 'green', fontWeight: 'bold', fontSize: '18px' }}>✨ Onboarding Complete!</p>
            <p className="text-caption">You're ready to start using Glimpse. Happy learning.</p>
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

export default App;
