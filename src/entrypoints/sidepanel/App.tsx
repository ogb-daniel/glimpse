import { ScrapbookList } from '../../components/features/scrapbook/ScrapbookList';

function App() {
  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header" style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border-hairline)' }}>
        <h1>Glimpse Scrapbook</h1>
        <p className="text-caption" style={{ margin: 0 }}>Your local research companion.</p>
      </header>
      <main>
        <ScrapbookList />
      </main>
    </div>
  );
}

export default App;
