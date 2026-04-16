import { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

interface UseCardAnimationOptions {
  delay?: number;
  duration?: number;
  translateY?: number;
  scale?: number;
}

export const useCardAnimation = (
  ref: React.RefObject<HTMLElement | null>,
  options: UseCardAnimationOptions = {}
) => {
  const {
    delay = 200,
    duration = 1000,
    translateY = 60,
    scale = 0.95
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [translateY, 0],
      scale: [scale, 1],
      duration,
      easing: 'easeOutElastic(1, .5)',
      delay
    });
  }, [ref, delay, duration, translateY, scale]);
};
