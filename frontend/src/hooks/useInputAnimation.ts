import { useRef, useCallback } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

interface UseInputAnimationOptions {
  borderColor?: string;
  glowColor?: string;
}

export const useInputAnimation = (options: UseInputAnimationOptions = {}) => {
  const { 
    borderColor = 'rgba(168, 85, 247, 0.8)', 
    glowColor = 'rgba(168, 85, 247, 0.4)' 
  } = options;

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const registerInput = useCallback((name: string, element: HTMLInputElement | null) => {
    if (element) {
      inputRefs.current.set(name, element);
    } else {
      inputRefs.current.delete(name);
    }
  }, []);

  const animateFocus = useCallback((name: string) => {
    const input = inputRefs.current.get(name);
    if (!input) return;

    anime({
      targets: input,
      scale: 1.02,
      duration: 200,
      easing: 'easeOutQuad',
      complete: () => {
        input.style.boxShadow = `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}`;
      }
    });
  }, [glowColor]);

  const animateBlur = useCallback((name: string) => {
    const input = inputRefs.current.get(name);
    if (!input) return;

    anime({
      targets: input,
      scale: 1,
      duration: 200,
      easing: 'easeOutQuad',
      complete: () => {
        input.style.boxShadow = 'none';
      }
    });
  }, []);

  const animateValid = useCallback((name: string) => {
    const input = inputRefs.current.get(name);
    if (!input) return;

    anime({
      targets: input,
      borderColor: borderColor,
      duration: 300,
      easing: 'easeOutQuad'
    });
  }, [borderColor]);

  return {
    registerInput,
    animateFocus,
    animateBlur,
    animateValid
  };
};
