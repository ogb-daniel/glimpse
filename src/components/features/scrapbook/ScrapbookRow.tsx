import { UserScrapbook } from '../../../shared/types/models';
import './ScrapbookRow.css';

interface ScrapbookRowProps {
  item: UserScrapbook;
  onDelete: (id: number) => void;
  onAskFollowUp: (item: UserScrapbook) => void;
}

export function ScrapbookRow({ item, onDelete, onAskFollowUp }: ScrapbookRowProps) {
  const date = item.learnedAt ? new Date(item.learnedAt).toLocaleDateString() : 'Unknown';
  const safeUrl = item.domainUrl.startsWith('http') ? item.domainUrl : `https://${item.domainUrl}`;

  return (
    <div className="scrapbook-row text-serif">
      <div className="scrapbook-row-header">
        <h3 className="text-serif" style={{ margin: 0, fontSize: '1.1rem' }}>{item.term}</h3>
        <span className="text-caption">{date}</span>
      </div>
      <p className="scrapbook-row-explanation">{item.explanation}</p>
      <div className="scrapbook-row-footer">
        <a href={safeUrl} target="_blank" rel="noreferrer" className="text-caption source-link">
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
            className="btn-ghost delete text-caption" 
            onClick={() => item.id !== undefined && onDelete(item.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
