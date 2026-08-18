import { Link } from 'react-router-dom';

export function Breadcrumb({ to, label }) {
  return (
    <Link to={to} className="breadcrumb-link">
      ‹ {label}
    </Link>
  );
}
