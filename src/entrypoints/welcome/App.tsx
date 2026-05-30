import React, { useEffect, useState } from 'react';
import { checkAiCapabilities, AiCapabilities } from '@/shared/utils/ai-health-service';
import { getOrCreateIdentity } from '@/shared/utils/identity-service';

function App() {
  const [capabilities, setCapabilities] = useState<AiCapabilities | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const [aiResult, idResult] = await Promise.all([
        checkAiCapabilities(),
        getOrCreateIdentity()
      ]);
      setCapabilities(aiResult);
      if (idResult.success) {
        setIdentityReady(true);
      }
    };
    initialize();
  }, []);

  // Simplified hold listener for tutorial
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMouseDown = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        timer = setTimeout(() => {
          setOnboarded(true);
        }, 1500);
      }
    };

    const handleMouseUp = () => {
      clearTimeout(timer);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
        
        <div style={{ marginBottom: '12px' }}>
          {identityReady ? (
            <p style={{ color: 'green', fontSize: '14px', margin: '4px 0' }}>✅ Local Identity: Created and secure.</p>
          ) : (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '14px', margin: '4px 0' }}>⏳ Initializing identity...</p>
          )}
        </div>

        <div>
          {capabilities === null ? (
            <p className="text-caption">Checking AI capabilities...</p>
          ) : (
            <div>
              {capabilities.available === 'readily' && (
                <p style={{ color: 'green', fontSize: '14px', margin: '4px 0' }}>✅ Local AI: Ready for inference.</p>
              )}
              {capabilities.available === 'after-download' && (
                <p style={{ color: 'var(--accent-gold-hc)', fontSize: '14px', margin: '4px 0' }}>⏳ Local AI: Downloading model (this may take a few minutes)...</p>
              )}
              {capabilities.available === 'no' && (
                <div style={{ color: '#d93025', marginTop: '16px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '8px' }}>❌ Hardware Not Supported</p>
                  <p className="text-serif" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                    Your current setup does not support built-in AI. To enable Glimpse, please ensure:
                  </p>
                  <ul style={{ fontSize: '13px', lineHeight: '1.5', paddingLeft: '20px' }}>
                    <li>Using Chrome 127+ (Dev/Canary recommended).</li>
                    <li>Enable <code>#prompt-api-for-gemini-nano</code> in <code>chrome://flags</code>.</li>
                    <li>Enable <code>#optimization-guide-on-device-model</code> in <code>chrome://flags</code>.</li>
                    <li>Update "Optimization Guide" in <code>chrome://components</code>.</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Interactive Tutorial</h2>
        <p className="text-serif" style={{ marginBottom: '20px' }}>
          Try the <strong>Magic Hold</strong>. Highlight the sentence below and hold your mouse button down for 1.5 seconds.
        </p>
        
        <div style={{ 
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
