import { UserScrapbook } from '../../../shared/types/models';
import './ScrapbookRow.css'; // I will write a small css file or use inline styles

interface ScrapbookRowProps {
  item: UserScrapbook;
  onDelete: (id: number) => void;
  onAskFollowUp: (item: UserScrapbook) => void;
}

export function ScrapbookRow({ item, onDelete, onAskFollowUp }: ScrapbookRowProps) {
  const date = new Date(item.learnedAt).toLocaleDateString();

  return (
    <div className="scrapbook-row text-serif">
      <div className="scrapbook-row-header">
        <h3 className="text-sans">{item.term}</h3>
        <span className="text-caption">{date}</span>
      </div>
      <p className="scrapbook-row-explanation">{item.explanation}</p>
      <div className="scrapbook-row-footer">
        <a href={item.domainUrl} target="_blank" rel="noreferrer" className="text-caption source-link">
          Source
        </a>
        <div className="scrapbook-row-actions">
          <button 
            className="btn-ghost text-caption" 
            onClick={() => onAskFollowUp(item)}
          >
            Ask Follow-up
          </button>
          <button 
            className="btn-ghost text-caption" 
            onClick={() => item.id && onDelete(item.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
