export function RankBadge({ rank }) {
  if (rank == null) return null;
  return <span className={`rank-badge${rank <= 3 ? ' top' : ''}`}>#{rank}</span>;
}
