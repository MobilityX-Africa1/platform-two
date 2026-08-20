// Top 3 each get their own brand color rather than one flat "top" treatment —
// #1 in coral echoes the site's own "Top 50" badge (mobilityx.africa), #2/#3
// step through the rest of the palette so a leaderboard reads as a podium,
// not a plain list.
const TOP_RANK_CLASS = { 1: 'rank-badge-1', 2: 'rank-badge-2', 3: 'rank-badge-3' };

export function RankBadge({ rank }) {
  if (rank == null) return null;
  const topClass = TOP_RANK_CLASS[rank];
  return <span className={`rank-badge${topClass ? ` top ${topClass}` : ''}`}>#{rank}</span>;
}
