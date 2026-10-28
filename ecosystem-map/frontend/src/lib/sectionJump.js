// In-page "show me the breakdown" jumps for metric cards whose underlying
// records live further down the same page. Scrolls the section into view
// (the .right-panel's scroll-padding keeps it clear of the sticky header) and
// moves keyboard focus there, so screen-reader and keyboard users land on the
// content the card pointed at rather than staying on the card.
export function jumpToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
