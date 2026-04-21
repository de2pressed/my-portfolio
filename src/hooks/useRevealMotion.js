'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function useRevealMotion(options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: options.y ?? 40,
        },
        {
          duration: options.duration ?? 1,
          ease: 'power4.out',
          opacity: 1,
          scrollTrigger: {
            once: true,
            start: options.start || 'top 82%',
            trigger: element,
          },
          y: 0,
        },
      );
    }, element);

    return () => context.revert();
  }, [options.duration, options.start, options.y]);

  return ref;
}
