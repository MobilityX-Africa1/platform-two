import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LeftPanel } from './LeftPanel';
import { QueryResultCard } from './QueryResultCard';
import { BackButton } from './BackButton';
import { useNotionData } from '../hooks/useNotionData';

const MOBILE_BREAKPOINT = '(max-width: 640px)';

export function Layout() {
  const { status, error } = useNotionData();
  const { pathname } = useLocation();
  const rightPanelRef = useRef(null);
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

  // Landing on a new page still scrolled from the previous one leaves the
  // incoming page's own lower content (metric cards, section headings)
  // sitting inside .page-header's sticky/frosted band, showing through the
  // blur behind the new title — the "fused, seamed" look. Scrolling back to
  // top on every route change means a page is never first seen mid-scroll.
  useEffect(() => {
    rightPanelRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <div className="app-background">
        <div className="app-background-glow" />
      </div>
      <LeftPanel collapsed={collapsed} />
      <div className="right-panel" ref={rightPanelRef}>
        <div className="right-panel-inner">
          {status === 'error' && (
            <div className="error-banner" style={{ marginBottom: 24 }}>
              Couldn't reach Notion: {error}
            </div>
          )}
          <BackButton />
          <QueryResultCard />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
