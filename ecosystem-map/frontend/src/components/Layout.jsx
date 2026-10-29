import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LeftPanel } from './LeftPanel';
import { PageSkeleton } from './Skeletons';
import { QueryResultCard } from './QueryResultCard';
import { BackButton } from './BackButton';
import { FloatingChat } from './FloatingChat';
import { useNotionData } from '../hooks/useNotionData';

const MOBILE_BREAKPOINT = '(max-width: 640px)';

export function Layout() {
  const { status, error } = useNotionData();
  const { pathname } = useLocation();
  const rightPanelRef = useRef(null);
  const drawerToggleRef = useRef(null);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_BREAKPOINT).matches
  );
  // On narrow screens the collapsed icon rail can be opened as an overlay
  // drawer, so labels and counts stay reachable on touch devices (where the
  // rail's hover tooltips never show). It records the path it was opened on,
  // so navigating anywhere from the drawer closes it without an effect.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState(null);
  const drawerOpen = drawerOpenedAt === pathname;
  const setDrawerOpen = (open) => setDrawerOpenedAt(open ? pathname : null);

  // Auto-collapse the sidebar to an icon rail when the window is dragged
  // narrower than tablet width, so it never squeezes the main content down
  // to the point where text overlaps. Crossing back over the breakpoint
  // resets it the same way most responsive sidebars behave.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (e) => {
      setCollapsed(e.matches);
      setDrawerOpenedAt(null);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Landing on a new page still scrolled from the previous one would show the
  // new title only after scrolling back up — scrolling to top on every route
  // change means a page is never first seen mid-scroll.
  useEffect(() => {
    rightPanelRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        setDrawerOpenedAt(null);
        drawerToggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <div className="app-background">
        <div className="app-background-glow" />
      </div>
      {/* Holds the rail's 64px in the flow while the drawer floats over the
          content, so opening it never shifts the page underneath. */}
      {collapsed && drawerOpen && <div className="left-panel-placeholder" aria-hidden="true" />}
      <LeftPanel
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        toggleRef={drawerToggleRef}
      />
      {collapsed && drawerOpen && (
        <div className="left-panel-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}
      <div className="right-panel" ref={rightPanelRef}>
        <div className="right-panel-inner">
          {status === 'error' && (
            <div className="error-banner" style={{ marginBottom: 24 }}>
              Couldn't reach Notion: {error}
            </div>
          )}
          <BackButton />
          <QueryResultCard />
          {/* Pages are lazy-loaded chunks (see App.jsx). This fallback only
              shows on a cold load straight into one; in-app navigation is
              wrapped in a transition, so the current page stays up until the
              next one's chunk is ready. */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}
