import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Detail pages that render their own deterministic <Breadcrumb>/econ-breadcrumb
// link back to a fixed list (e.g. CountryPage's "‹ Countries") already give
// the user a way back — showing the generic history-based Back pill above it
// too was a second, redundant back affordance on the same page.
const HAS_OWN_BREADCRUMB = [
  /^\/country\//,
  /^\/company\//,
  /^\/allocator\//,
  /^\/vertical\//,
  /^\/asset-economics\/.+/,
];

// location.key is 'default' on a fresh load / hard refresh and a unique
// value for every subsequent in-app navigation (including forward/back), so
// it doubles as "is there SPA history to go back to" with no extra state.
export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack =
    location.pathname !== '/' &&
    location.key !== 'default' &&
    !HAS_OWN_BREADCRUMB.some((re) => re.test(location.pathname));

  // .page-header only reserves top padding for the floating pill (see
  // index.css) when one is actually rendered — a body class is the simplest
  // way to reach that sibling-in-another-component's CSS without prop
  // drilling canGoBack through every page.
  useEffect(() => {
    document.body.classList.toggle('has-back-button', canGoBack);
    return () => document.body.classList.remove('has-back-button');
  }, [canGoBack]);

  if (!canGoBack) return null;

  return (
    <button type="button" className="back-button" onClick={() => navigate(-1)}>
      <ArrowLeft size={15} strokeWidth={2.25} />
      Back
    </button>
  );
}
