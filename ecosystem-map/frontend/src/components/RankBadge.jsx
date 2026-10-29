// Top 3 each get their own brand color rather than one flat "top" treatment —
// #1 in coral echoes the site's own "Top 50" badge (mobilityx.africa), #2/#3
// step through the rest of the palette so a leaderboard reads as a podium,
// not a plain list.
const TOP_RANK_CLASS = { 1: 'rank-badge-1', 2: 'rank-badge-2', 3: 'rank-badge-3' };

// `reserve` keeps an invisible badge-width slot for unranked rows so the
// logo/name column stays aligned down a table.
export function RankBadge({ rank, reserve = false }) {
  if (rank == null) return reserve ? <span className="rank-badge rank-badge-empty" aria-hidden="true" /> : null;
  const topClass = TOP_RANK_CLASS[rank];
  return <span className={`rank-badge${topClass ? ` top ${topClass}` : ''}`}>#{rank}</span>;
}
