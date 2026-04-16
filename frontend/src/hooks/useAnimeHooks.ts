import { useEffect, useCallback } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

export const useScrollReveal = () => {
  useEffect(() => {
    const groups = document.querySelectorAll('.reveal-group');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.reveal-item');
            // Assembly Effect: Pieces bounce and fall in elastic synchronization
            if (items.length > 0) {
              anime({
                targets: items,
                opacity: [0, 1],
                translateY: [anime.stagger([30, -30]), 0],
                translateX: [anime.stagger([-20, 20]), 0],
                duration: 1200,
                easing: 'spring(1, 80, 12, 0)',
                delay: anime.stagger(100)
              });
            } else {
              anime({
                targets: entry.target,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 1200,
                easing: 'spring(1, 80, 12, 0)'
              });
            }
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    groups.forEach((el) => {
      const items = el.querySelectorAll('.reveal-item');
      if (items.length > 0) {
        items.forEach(item => { (item as HTMLElement).style.opacity = '0'; });
      } else {
        (el as HTMLElement).style.opacity = '0';
      }
      observer.observe(el);
    });

    return () => {
      groups.forEach(el => observer.unobserve(el));
    };
  }, []);
};

export const useHoverInteractions = () => {
  const startBreathing = useCallback((targets: string | Element | NodeList | NodeListOf<Element>) => {
    anime({
      targets,
      translateX: () => anime.random(-2, 2),
      translateY: () => anime.random(-2, 2),
      duration: () => anime.random(2500, 3500),
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutQuad'
    });
  }, []);

  useEffect(() => {
    // Scan the initial DOM after 100ms to ensure rendering is complete
    const timeout = setTimeout(() => {
      const breathingTargets = document.querySelectorAll('.breathing-icon svg path, .breathing-icon svg circle, .breathing-icon svg polyline, .breathing-icon svg rect');
      if (breathingTargets.length > 0) {
        startBreathing(breathingTargets);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [startBreathing]);

  // Custom per-card effects
  const handleIconHover = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const children = el.querySelectorAll('svg path, svg line, svg circle, svg polyline, svg polygon, svg rect');
    const svg = el.querySelector('svg');
    if (!svg || children.length === 0) return;
    
    // Kill the breathing loop
    anime.remove(children);
    anime.remove(svg);
    
    if (el.classList.contains('talent-card')) {
      // Talent: Pop effect (asynchronous scaling)
      anime({
        targets: children,
        scale: [1, 1.25, 1],
        translateY: anime.stagger([0, -5, 0]),
        duration: 800,
        delay: anime.stagger(100),
        easing: 'spring(1, 80, 10, 0)'
      });
    } else if (el.classList.contains('educator-card')) {
      // Educator: Book "drawing" (line drawing sequence)
      anime({
        targets: children,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1000,
        delay: anime.stagger(150),
      });
      anime({
        targets: svg,
        scale: [1, 1.15, 1],
        duration: 800,
        easing: 'spring(1, 80, 10, 0)'
      });
    } else if (el.classList.contains('recruiter-card')) {
      // Recruiter: Swinging Briefcase (rotateZ on the whole SVG)
      anime({
        targets: svg,
        rotateZ: [0, -20, 20, -10, 10, 0],
        scale: 1.15,
        duration: 1200,
        easing: 'easeOutElastic(1, .6)'
      });
    } else {
      // Fallback
      anime({
        targets: children,
        scale: 1.05,
        translateX: anime.stagger([-5, 5]),
        translateY: anime.stagger([-5, 5]),
        duration: 800,
        easing: 'spring(1, 100, 10, 0)'
      });
    }
  }, []);

  const handleIconLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const children = el.querySelectorAll('svg path, svg line, svg circle, svg polyline, svg polygon, svg rect');
    const svg = el.querySelector('svg');
    if (!svg || children.length === 0) return;
    
    anime.remove(children);
    anime.remove(svg);
    
    anime({
      targets: [children, svg],
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      rotateY: 0,
      rotateZ: 0,
      duration: 600,
      easing: 'easeOutElastic(1, .5)',
      complete: () => {
        // After finishing the retraction, only the originally breathing container returns to breathing
        const breathingTarget = el.querySelector('.breathing-icon');
        if (breathingTarget || el.classList.contains('breathing-icon')) {
          const svgPaths = el.querySelectorAll('svg path, svg circle, svg polyline, svg rect');
          startBreathing(svgPaths);
        }
      }
    });
  }, [startBreathing]);

  return { handleIconHover, handleIconLeave };
};
