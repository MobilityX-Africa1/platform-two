import { useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { StatusBar } from './StatusBar';
import { HierarchyTree } from './HierarchyTree';
import { AIQueryBox } from './AIQueryBox';

const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 260;
export const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebarWidth';
const STORAGE_KEY = SIDEBAR_WIDTH_STORAGE_KEY;

function clampWidth(value) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export function LeftPanel({ collapsed }) {
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

  return (
    <div
      className={`left-panel${collapsed ? ' collapsed' : ''}${resizing ? ' resizing' : ''}`}
      style={collapsed ? undefined : { flexBasis: width, maxWidth: width, minWidth: width }}
    >
      <div className="brand-header">
        <div className="brand-header-row">
          <img src="/logo_x.avif" alt="Company logo" className="brand-logo" />
        </div>
        {!collapsed && <StatusBar />}
      </div>

      <div className="left-panel-scroll">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}
          style={{ marginBottom: 'var(--space-3)' }}
          title="Dashboard"
        >
          <span className="material-icons" style={{ fontSize: 14 }}>dashboard</span>
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {!collapsed && (
          <>
            <div className="panel-section-title">Ecosystem</div>
            <HierarchyTree />
          </>
        )}
      </div>

      {!collapsed && <AIQueryBox />}

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
