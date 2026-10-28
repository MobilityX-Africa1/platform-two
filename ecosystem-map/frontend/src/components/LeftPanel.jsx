import { useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, PanelLeftClose } from 'lucide-react';
import { StatusBar } from './StatusBar';
import { HierarchyTree } from './HierarchyTree';

const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 260;
export const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebarWidth';
const STORAGE_KEY = SIDEBAR_WIDTH_STORAGE_KEY;

function clampWidth(value) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export function LeftPanel({ collapsed, drawerOpen = false, onToggleDrawer, toggleRef }) {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return stored ? clampWidth(stored) : DEFAULT_WIDTH;
  });
  const [resizing, setResizing] = useState(false);
  const widthRef = useRef(width);

  // Drag-to-resize, Google-Drive-style: pointer capture on the handle itself
  // means we keep tracking the drag even if the cursor slips past the thin
  // hit target, without needing document-level listeners.
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startWidth = widthRef.current;
    setResizing(true);

    const handlePointerMove = (moveEvent) => {
      const next = clampWidth(startWidth + (moveEvent.clientX - startX));
      widthRef.current = next;
      setWidth(next);
    };
    const handlePointerUp = () => {
      setResizing(false);
      handle.releasePointerCapture(e.pointerId);
      window.localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      handle.removeEventListener('pointermove', handlePointerMove);
      handle.removeEventListener('pointerup', handlePointerUp);
    };
    handle.addEventListener('pointermove', handlePointerMove);
    handle.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleResetWidth = useCallback(() => {
    widthRef.current = DEFAULT_WIDTH;
    setWidth(DEFAULT_WIDTH);
    window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
  }, []);

  // On narrow screens the panel is an icon rail (`collapsed`); the toggle
  // opens it as a full-width overlay drawer with labels and counts.
  const compact = collapsed && !drawerOpen;
  const ToggleIcon = drawerOpen ? PanelLeftClose : Menu;

  return (
    <div
      id="left-panel"
      className={`left-panel${compact ? ' collapsed' : ''}${collapsed && drawerOpen ? ' drawer-open' : ''}${resizing ? ' resizing' : ''}`}
      style={collapsed ? undefined : { flexBasis: width, maxWidth: width, minWidth: width }}
    >
      <div className="brand-header">
        <div className="brand-header-row">
          <img src="/logo_x.avif" alt="MobilityX Africa" className="brand-logo" />
          {collapsed && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={onToggleDrawer}
              aria-expanded={drawerOpen}
              aria-controls="left-panel"
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
              ref={toggleRef}
            >
              <ToggleIcon size={18} />
            </button>
          )}
        </div>
        {!compact && <StatusBar />}
      </div>

      <div className="left-panel-scroll">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}
          style={{ marginBottom: 'var(--space-3)' }}
          title="Dashboard"
          aria-label={compact ? 'Dashboard' : undefined}
        >
          <span className="material-icons" style={{ fontSize: 14 }} aria-hidden="true">dashboard</span>
          {!compact && <span>Dashboard</span>}
        </NavLink>

        {!compact && <div className="panel-section-title">Ecosystem</div>}
        <HierarchyTree compact={compact} />
      </div>

      {!collapsed && (
        <div
          className="left-panel-resize-handle"
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetWidth}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          title="Drag to resize, double-click to reset"
        />
      )}
    </div>
  );
}
