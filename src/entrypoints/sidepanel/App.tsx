import { useState, useEffect } from 'react';
import { ScrapbookList } from '../../components/features/scrapbook/ScrapbookList';
import { AiChat } from '../../components/features/ai-chat/AiChat';
import { BloomContext } from '../../shared/types/messaging';
import './App.css';

function App() {
  const [bloomContext, setBloomContext] = useState<BloomContext | null>(null);

  useEffect(() => {
    const checkBloom = async () => {
      try {
        // Try session storage first
        const sessionData = await (browser.storage as any).session.get('bloom_context');
        if (sessionData && sessionData.bloom_context) {
          setBloomContext(sessionData.bloom_context as BloomContext);
          await (browser.storage as any).session.remove('bloom_context');
        } else {
          // Fallback to local
          const localData = await browser.storage.local.get('bloom_context');
          if (localData && (localData as any).bloom_context) {
            setBloomContext((localData as any).bloom_context as BloomContext);
            await browser.storage.local.remove('bloom_context');
          }
        }
      } catch (e) {
        console.warn('Glimpse: Failed to check bloom context', e);
      }
    };

    checkBloom();
  }, []);

  const handleCloseChat = () => {
    setBloomContext(null);
  };

  return (
    <div className={`sidepanel-container ${bloomContext ? 'chat-mode' : ''}`}>
      {bloomContext ? (
        <AiChat initialContext={bloomContext} onClose={handleCloseChat} />
      ) : (
        <>
          <header className="sidepanel-header">
            <h1>Glimpse Scrapbook</h1>
            <p className="text-caption">Your local research companion.</p>
          </header>
          <main>
            <ScrapbookList />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
