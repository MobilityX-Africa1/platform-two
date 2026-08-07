import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftPanel } from './LeftPanel';
import { QueryResultCard } from './QueryResultCard';
import { useNotionData } from '../hooks/useNotionData';

const MOBILE_BREAKPOINT = '(max-width: 640px)';

export function Layout() {
  const { status, error } = useNotionData();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_BREAKPOINT).matches
  );

  // Auto-collapse the sidebar to an icon rail when the window is dragged
  // narrower than tablet width, so it never squeezes the main content down
  // to the point where text overlaps. Crossing back over the breakpoint
  // resets it the same way most responsive sidebars behave.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (e) => setCollapsed(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="app-shell">
      <div className="app-background">
        <div className="app-background-glow" />
      </div>
      <LeftPanel collapsed={collapsed} />
      <div className="right-panel">
        <div className="right-panel-inner">
          {status === 'error' && (
            <div className="error-banner" style={{ marginBottom: 24 }}>
              Couldn't reach Notion: {error}
            </div>
          )}
          <QueryResultCard />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
