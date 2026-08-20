import { useNavigate } from 'react-router-dom';

// A <tr> can't be a <Link> (an <a> can't wrap a <tr>), so every data-table
// row that navigates somewhere uses this same click/keyboard-activation
// pattern instead — identical to how MarketComparisonTable's rows behave.
export function Row({ to, children }) {
  const navigate = useNavigate();
  return (
    <tr
      data-clickable
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </tr>
  );
}
