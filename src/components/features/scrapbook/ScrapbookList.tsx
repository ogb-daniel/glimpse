import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/db/dexie-db';
import { useScrapbook } from '../../../hooks/use-scrapbook';
import { ScrapbookRow } from './ScrapbookRow';
import { UserScrapbook } from '../../../shared/types/models';
import './ScrapbookList.css';

export function ScrapbookList() {
  const { deleteInteraction } = useScrapbook();
  
  const items = useLiveQuery(
    () => db.userScrapbook.orderBy('learnedAt').reverse().toArray()
  );

  const handleAskFollowUp = (item: UserScrapbook) => {
    console.log('Follow-up requested for:', item);
    // Future story: Open side panel chat or similar
  };

  const handleDelete = async (id: number) => {
    const result = await deleteInteraction(id);
    if (!result.success) {
      alert(`Failed to delete: ${result.error}`);
    }
  };

  if (items === undefined) return <div className="loading text-serif">Loading Scrapbook...</div>;

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
            onDelete={handleDelete}
            onAskFollowUp={handleAskFollowUp}
          />
        ))
      )}
    </div>
  );
}
