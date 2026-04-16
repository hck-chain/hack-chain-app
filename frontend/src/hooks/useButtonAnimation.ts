import { useCallback } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

export const useButtonAnimation = () => {
  const animateHover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    anime({
      targets: e.currentTarget,
      scale: 1.05,
      duration: 200,
      easing: 'easeOutQuad'
    });
  }, []);

  const animateLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    anime({
      targets: e.currentTarget,
      scale: 1,
      duration: 200,
      easing: 'easeOutQuad'
    });
  }, []);

  const animateClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    anime({
      targets: e.currentTarget,
      scale: [1.05, 0.95, 1],
      duration: 300,
      easing: 'easeOutQuad'
    });
  }, []);

  return {
    animateHover,
    animateLeave,
    animateClick
  };
};
