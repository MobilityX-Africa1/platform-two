import { useState } from 'react';

// Google's favicon service can't resolve these (no discoverable favicon, or
// the domain blocks it) even though the org has a real brand mark — serve
// the real logo locally instead of falling back to an initial letter.
const LOCAL_LOGO_OVERRIDES = {
  basigo: '/logos/basigo.webp',
  spiro: '/logos/spiro.png',
  gigmile: '/logos/gigmile.webp',
  'stima+okoa': '/logos/stima.png',
  guarantco: '/logos/guarantco.png',
};

function extractDomain(url) {
  if (!url) return null;
  try {
    const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`);
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function CompanyLogo({ name, website, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const localSrc = LOCAL_LOGO_OVERRIDES[name?.trim().toLowerCase()];
  const domain = extractDomain(website);
  const src = localSrc || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

  if (!src || failed) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: 'var(--plum-bg)',
          color: 'var(--plum)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.42,
          flexShrink: 0,
        }}
      >
        {name?.[0]?.toUpperCase() || '?'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        objectFit: 'contain',
        background: '#fff',
        boxShadow: '0 0 0 1px var(--border)',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
