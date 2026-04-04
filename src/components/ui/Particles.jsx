import { useEffect, useRef } from 'react';

export function FloatingDust() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const particles = [];
    const count = 18;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = Math.random() * 10 + 8;
      const drift = (Math.random() - 0.5) * 60;
      const opacity = Math.random() * 0.3 + 0.05;

      Object.assign(p.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `rgba(212,175,55,${opacity})`,
        left: `${x}%`,
        bottom: '-10px',
        animation: `particle-drift ${duration}s ${delay}s ease-in infinite`,
        '--drift': `${drift}px`,
        pointerEvents: 'none',
      });
      el.appendChild(p);
      particles.push(p);
    }

    return () => particles.forEach(p => p.remove());
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}
    />
  );
}

export function GoldParticles({ x, y, count = 20, onDone }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 80 + 40;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const size = Math.random() * 6 + 3;
      const colors = ['#ffd700','#d4af37','#fff','#ffaa00'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      Object.assign(p.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        left: `${x}px`,
        top: `${y}px`,
        boxShadow: `0 0 4px ${color}`,
        transition: `all 0.8s cubic-bezier(0.4,0,1,1)`,
        opacity: '1',
      });
      el.appendChild(p);
      particles.push(p);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          p.style.transform = `translate(${dx}px, ${dy - 40}px)`;
          p.style.opacity = '0';
        });
      });
    }

    const timer = setTimeout(() => {
      particles.forEach(p => p.remove());
      if (onDone) onDone();
    }, 900);

    return () => {
      clearTimeout(timer);
      particles.forEach(p => p.remove());
    };
  }, [x, y, count, onDone]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
}
