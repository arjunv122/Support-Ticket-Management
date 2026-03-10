import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ring, setRing] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ringX = -100, ringY = -100;
    let rafId;

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      ringX = lerp(ringX, pos.x, 0.12);
      ringY = lerp(ringY, pos.y, 0.12);
      setRing({ x: ringX, y: ringY });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      const clickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer';
      setIsPointer(!!clickable);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [pos.x, pos.y, isVisible]);

  return (
    <>
      {/* Dot — follows cursor exactly */}
      <div
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: isPointer ? 10 : 7,
          height: isPointer ? 10 : 7,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.2s, height 0.2s, opacity 0.3s',
          boxShadow: '0 0 8px rgba(99,102,241,0.8)',
        }}
      />
      {/* Ring — smooth-follow */}
      <div
        style={{
          position: 'fixed',
          left: ring.x,
          top: ring.y,
          width: isPointer ? 44 : 32,
          height: isPointer ? 44 : 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(99,102,241,0.6)',
          background: isPointer ? 'rgba(99,102,241,0.08)' : 'transparent',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9998,
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.25s, height 0.25s, opacity 0.3s, background 0.25s',
        }}
      />
      <style>{`
        @media (hover: none) {
          /* Touch devices - hide custom cursor */
          body { cursor: auto !important; }
        }
        @media (hover: hover) {
          body { cursor: none !important; }
          a, button, [role=button], select, input, textarea { cursor: none !important; }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
