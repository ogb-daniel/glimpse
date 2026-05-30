import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/db/dexie-db';
import { useScrapbook } from '../../../hooks/use-scrapbook';
import { ScrapbookRow } from './ScrapbookRow';
import './ScrapbookList.css';

export function ScrapbookList() {
  const { deleteInteraction } = useScrapbook();
  
  const items = useLiveQuery(
    () => db.userScrapbook.orderBy('learnedAt').reverse().toArray()
  );

  const handleAskFollowUp = (item: any) => {
    console.log('Follow-up requested for:', item);
    // Future story: Open side panel chat or similar
  };

  if (items === undefined) return <div className="loading text-sans">Loading Scrapbook...</div>;

  return (
    <div className="scrapbook-list">
      {items.length === 0 ? (
        <div className="empty-state text-serif">
          No research entries yet. Highlight some text and hold to start learning!
        </div>
      ) : (
        items.map((item) => (
          <ScrapbookRow 
            key={item.id} 
            item={item} 
            onDelete={deleteInteraction}
            onAskFollowUp={handleAskFollowUp}
          />
        ))
      )}
    </div>
  );
}
