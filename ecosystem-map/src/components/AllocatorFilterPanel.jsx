import { useNotionData } from '../hooks/useNotionData';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function ChipRow({ label, options, valueKey }) {
  const active = useAllocatorFilterStore((s) => s[valueKey]);
  const toggleFilter = useAllocatorFilterStore((s) => s.toggleFilter);

  return (
    <div className="filter-group">
      <div className="filter-group-label">{label}</div>
      <div className="filter-chip-row">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`filter-chip${active === opt ? ' selected' : ''}`}
            onClick={() => toggleFilter(valueKey, opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AllocatorFilterPanel() {
  const { allocators, status } = useNotionData();
  const aminOnly = useAllocatorFilterStore((s) => s.aminOnly);
  const toggleAminOnly = useAllocatorFilterStore((s) => s.toggleAminOnly);

  if (status !== 'ready') return null;

  const investorTypes = unique(allocators.map((a) => a.typeOfInvestor));
  const geos = unique(allocators.flatMap((a) => a.geo || []));
  const instruments = unique(allocators.flatMap((a) => a.investmentInstrument || []));
  const focusAreas = unique(allocators.flatMap((a) => a.focusAreas || []));

  return (
    <div>
      <ChipRow label="Investor type" options={investorTypes} valueKey="investorType" />
      <ChipRow label="Geographic focus" options={geos} valueKey="geo" />
      <ChipRow label="Investment instrument" options={instruments} valueKey="instrument" />
      <ChipRow label="Focus area" options={focusAreas} valueKey="focusArea" />
      <div className="filter-group">
        <div className="filter-group-label">Membership</div>
        <div className="filter-chip-row">
          <button
            type="button"
            className={`filter-chip${aminOnly ? ' selected' : ''}`}
            onClick={toggleAminOnly}
          >
            AMIN members only
          </button>
        </div>
      </div>
    </div>
  );
}
