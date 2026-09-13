import { useState, useEffect } from 'react';

export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set initial value
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
}
