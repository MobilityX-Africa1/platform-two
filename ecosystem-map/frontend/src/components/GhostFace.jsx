import { useEffect, useRef, useState } from 'react';

// Two dots with no other facial detail — reads as "attentive," not a
// mascot — shared by every place the "Ask EcoMap" AI feature shows a face:
// the floating launcher, the sidebar query box label, and the open chat
// panel's header. Each instance tracks the cursor independently (it measures
// its own on-screen center), so the eyes stay "attentive" wherever the face
// is small or large. `background` adds the plum circular fill for contexts
// that aren't already sitting inside a colored button (the FAB provides its
// own via .floating-chat-fab, so it passes background={false}).
export function GhostFace({ size = 20, eyeRange = 3, background = false, className }) {
  const ref = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function measure() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    let raf = null;
    function handleMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const dx = e.clientX - centerRef.current.x;
        const dy = e.clientY - centerRef.current.y;
        const dist = Math.hypot(dx, dy) || 1;
        const scale = Math.min(eyeRange, dist) / dist;
        setEyeOffset({ x: dx * scale, y: dy * scale });
      });
    }
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [eyeRange]);

  // Same 56:8:20 (circle:eye:face-width) proportions as the original
  // floating-launcher face, scaled to whatever size this instance renders at.
  const eyeSize = Math.max(2, Math.round((size * 8) / 56));
  const faceWidth = Math.max(eyeSize * 2, Math.round((size * 20) / 56));

  return (
    <span
      ref={ref}
      className={`ghost-face${background ? ' ghost-face--bg' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="ghost-face-eyes" style={{ width: faceWidth, height: eyeSize }}>
        <span
          className="ghost-face-eye"
          style={{ width: eyeSize, height: eyeSize, left: 0, transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
        />
        <span
          className="ghost-face-eye"
          style={{ width: eyeSize, height: eyeSize, right: 0, transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
        />
      </span>
    </span>
  );
}
