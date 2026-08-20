import { COUNTRY_CODES } from '../lib/flags';

export function CountryFlag({ name, size = 20 }) {
  const code = COUNTRY_CODES[name];
  const height = size;
  const width = Math.round(size * 1.33);

  if (!code) {
    return (
      <span style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }} role="img" aria-label={name}>
        🌍
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${code.toLowerCase()}.png 2x`}
      alt={`${name} flag`}
      width={width}
      height={height}
      style={{
        width,
        height,
        objectFit: 'cover',
        borderRadius: 3,
        boxShadow: '0 0 0 1px rgba(30,27,36,0.1)',
        flexShrink: 0,
      }}
      loading="lazy"
    />
  );
}
