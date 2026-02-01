import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target;
      const isClickable = 
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('clickable') ||
        window.getComputedStyle(target).cursor === 'pointer';
        
      setIsPointer(isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="cursor-dot"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: isPointer ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)'
        }}
      />
      <div 
        className="cursor-ring"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: isPointer ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)'
        }}
      />
      <style>{`
        body {
          cursor: none;
        }
        
        .cursor-dot {
          width: 8px;
          height: 8px;
          background-color: var(--accent, #8b5cf6);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.15s ease-out;
        }
        
        .cursor-ring {
          width: 32px;
          height: 32px;
          border: 2px solid var(--primary, #6366f1);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transition: left 0.1s ease-out, top 0.1s ease-out, transform 0.2s ease-out;
          mix-blend-mode: difference;
        }
        
        @media (max-width: 768px) {
          .cursor-dot, .cursor-ring {
            display: none;
          }
          body {
            cursor: auto;
          }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
