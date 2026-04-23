"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

import { createTiltEffect } from "@/lib/tilt-effect";

type UsePanelTiltOptions = {
  enabled?: boolean;
  maxRotation?: number;
  perspective?: number;
  lerpFactor?: number;
  easeOutDuration?: number;
};

export function usePanelTilt(
  ref: RefObject<HTMLElement | null>,
  {
    enabled = true,
    maxRotation = 8,
    perspective = 1500,
    lerpFactor = 0.14,
    easeOutDuration = 220,
  }: UsePanelTiltOptions = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) {
      return;
    }

    const pointerQuery = window.matchMedia("(pointer: fine)");
    if (!pointerQuery.matches) {
      return;
    }

    element.style.willChange = "transform";

    const tilt = createTiltEffect(element, {
      maxRotation,
      perspective,
      lerpFactor,
      easeOutDuration,
    });

    return () => {
      tilt.destroy();
      element.style.willChange = "";
    };
  }, [easeOutDuration, enabled, lerpFactor, maxRotation, perspective, ref]);
}
