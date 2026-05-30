import { ScrapbookList } from '../../components/features/scrapbook/ScrapbookList';
import './App.css';

function App() {
  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <h1>Glimpse Scrapbook</h1>
        <p className="text-caption">Your local research companion.</p>
      </header>
      <main>
        <ScrapbookList />
      </main>
    </div>
  );
}

export default App;
