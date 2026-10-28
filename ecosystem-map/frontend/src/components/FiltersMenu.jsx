import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Search, ChevronRight, ChevronLeft, X } from 'lucide-react';

// Replaces the old always-expanded, everything-at-once filter drawer with a
// two-level popover anchored to the trigger button: pick a category, then
// pick a value within it — so the panel never dumps five chip walls on
// screen at once. Typing in the search box short-circuits both levels and
// shows matching values across every category directly.
//
// `groups` is [{ key, label, options: [{ value, text, count? }], active,
// onToggle }]; each field is single-select, so choosing a value returns to
// the category list rather than staying open for more picks in that group.
// `activeItems` is the flat "currently applied" list ([{ key, text,
// onClear }]) shown at the top of the root view.
export function FiltersMenu({ groups, activeItems, onClearAll }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('root'); // 'root' | a group key
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const activeCount = activeItems.length;

  function close() {
    setOpen(false);
    setView('root');
    setQuery('');
  }

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, view]);

  function toggleOpen() {
    setOpen((wasOpen) => {
      if (wasOpen) {
        setView('root');
        setQuery('');
      }
      return !wasOpen;
    });
  }

  function selectValue(group, value) {
    group.onToggle(value);
    setView('root');
    setQuery('');
  }

  const activeGroup = groups.find((g) => g.key === view);

  const searchResults = query
    ? groups.flatMap((g) =>
        g.options
          .filter((o) => o.text.toLowerCase().includes(query.toLowerCase()))
          .map((o) => ({ ...o, group: g, isActive: g.active === o.value })),
      )
    : [];

  return (
    <div className="filters-menu" ref={menuRef}>
      <button
        type="button"
        className={`filter-chip filters-trigger${activeCount ? ' active' : ''}`}
        onClick={toggleOpen}
        aria-expanded={open}
      >
        <span className="row" style={{ gap: 6 }}>
          <SlidersHorizontal size={13} /> Filters
          {activeCount > 0 && <span className="count">{activeCount}</span>}
        </span>
      </button>

      {open && (
        <div className="filters-popover" role="dialog" aria-label="Filters">
          <div className="filters-popover-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search filter options…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="filters-popover-body">
            {query ? (
              searchResults.length > 0 ? (
                searchResults.map((r) => (
                  <button
                    key={`${r.group.key}-${r.value}`}
                    type="button"
                    className={`filters-result-row${r.isActive ? ' active' : ''}`}
                    onClick={() => selectValue(r.group, r.value)}
                  >
                    <span className="filters-result-text">{r.text}</span>
                    <span className="filters-result-meta">
                      <span className="filters-result-category">{r.group.label}</span>
                      {r.count != null && <span className="filter-chip-count">{r.count}</span>}
                    </span>
                  </button>
                ))
              ) : (
                <div className="filters-empty">No matching filters</div>
              )
            ) : view === 'root' ? (
              <>
                {activeItems.length > 0 && (
                  <div className="filters-applied">
                    <div className="filters-applied-header">
                      <span>Applied</span>
                      <button type="button" className="filters-clear-all" onClick={onClearAll}>
                        Clear all
                      </button>
                    </div>
                    <div className="active-filters-row" style={{ padding: 0 }}>
                      {activeItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className="filter-chip selected active-filter-chip"
                          onClick={item.onClear}
                        >
                          {item.text}
                          <X size={11} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="filters-cat-list">
                  {groups.map((g) => {
                    const activeOpt = g.options.find((o) => o.value === g.active);
                    return (
                      <button
                        key={g.key}
                        type="button"
                        className="filters-cat-row"
                        onClick={() => setView(g.key)}
                      >
                        <span className="filters-cat-label">{g.label}</span>
                        <span className="filters-cat-right">
                          {activeOpt && <span className="filters-cat-value">{activeOpt.text}</span>}
                          <ChevronRight size={14} aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              activeGroup && (
                <div className="filters-drill">
                  <div className="filters-drill-header">
                    <button type="button" className="filters-back" onClick={() => setView('root')}>
                      <ChevronLeft size={14} aria-hidden="true" /> {activeGroup.label}
                    </button>
                    {activeGroup.active != null && (
                      <button
                        type="button"
                        className="filters-clear-all"
                        onClick={() => selectValue(activeGroup, activeGroup.active)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="filter-chip-row filters-drill-chips">
                    {activeGroup.options.length > 0 ? (
                      activeGroup.options.map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          className={`filter-chip${activeGroup.active === opt.value ? ' selected' : ''}`}
                          onClick={() => selectValue(activeGroup, opt.value)}
                        >
                          {opt.text}
                          {opt.count != null && <span className="filter-chip-count">{opt.count}</span>}
                        </button>
                      ))
                    ) : (
                      <div className="filters-empty">No options available</div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
