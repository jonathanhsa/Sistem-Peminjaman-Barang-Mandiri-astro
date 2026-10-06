import { animate, inView, stagger } from 'motion';

export function initAnimations() {
  // Fade Up
  inView('[data-animate="fade-up"]', (element) => {
    // initial state is set via CSS or we can rely on motion
    animate(
      element,
      { opacity: [0, 1], y: [8, 0] },
      { duration: 0.25, ease: [0.16, 1, 0.3, 1] } // Custom spring-like bezier
    );
  });

  // Fade In
  inView('[data-animate="fade-in"]', (element) => {
    animate(
      element,
      { opacity: [0, 1] },
      { duration: 0.2, ease: 'easeOut' }
    );
  });

  // Staggered Lists (Cards, grids, etc.)
  inView('[data-animate="stagger-list"]', (element) => {
    const items = element.children;
    if (items.length > 0) {
      animate(
        items,
        { opacity: [0, 1], y: [8, 0] },
        { 
          delay: stagger(0.03), 
          duration: 0.25, 
          ease: [0.16, 1, 0.3, 1]
        }
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', initAnimations);
document.addEventListener('astro:page-load', initAnimations);
