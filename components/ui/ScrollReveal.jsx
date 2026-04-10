'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — wraps children in a fade-up reveal triggered by IntersectionObserver.
 * Props:
 *   delay  — ms offset before the animation starts (default 0)
 *   once   — only animate on first intersection (default true)
 */
export default function ScrollReveal({ children, delay = 0, once = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s cubic-bezier(0.22,0.9,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,0.9,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
