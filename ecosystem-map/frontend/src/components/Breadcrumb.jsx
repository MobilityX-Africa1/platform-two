import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Same enclosed, sticky pill as BackButton (see .breadcrumb-link in
// index.css) — this is what stands in for it on detail pages, so it needs
// to look and behave like the identical affordance, not a second one.
export function Breadcrumb({ to, label }) {
  return (
    <Link to={to} className="breadcrumb-link">
      <ArrowLeft size={15} strokeWidth={2.25} />
      {label}
    </Link>
  );
}
