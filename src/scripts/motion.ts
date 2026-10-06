import { animate, inView, stagger } from 'motion';

export function initAnimations() {
  // Fade Up
  inView('[data-animate="fade-up"]', (info) => {
    // initial state is set via CSS or we can rely on motion
    animate(
      info.target,
      { opacity: [0, 1], y: [40, 0] },
      { duration: 0.7, ease: [0.16, 1, 0.3, 1] } // Custom spring-like bezier
    );
  });

  // Fade In
  inView('[data-animate="fade-in"]', (info) => {
    animate(
      info.target,
      { opacity: [0, 1] },
      { duration: 0.8, ease: 'easeOut' }
    );
  });

  // Staggered Lists (Cards, grids, etc.)
  inView('[data-animate="stagger-list"]', (info) => {
    const items = info.target.children;
    if (items.length > 0) {
      animate(
        items,
        { opacity: [0, 1], y: [30, 0] },
        { 
          delay: stagger(0.08, { startDelay: 0.1 }), 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1]
        }
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', initAnimations);
document.addEventListener('astro:page-load', initAnimations);
