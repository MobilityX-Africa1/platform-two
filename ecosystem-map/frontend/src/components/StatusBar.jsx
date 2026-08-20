import { RefreshCw } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';

function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

export function StatusBar() {
  const { status, refreshing, cached, lastRefreshed, refresh } = useNotionData();

  return (
    <div className="status-line">
      <span className={`status-dot${cached ? ' stale' : ''}`} />
      <span>
        Live from Notion · refreshed {timeAgo(lastRefreshed)} · {cached ? 'cached' : 'fresh'}
      </span>
      <button
        type="button"
        className={`refresh-btn${refreshing || status === 'loading' ? ' spinning' : ''}`}
        onClick={refresh}
        aria-label="Refresh from Notion"
      >
        <RefreshCw size={13} />
      </button>
    </div>
  );
}
