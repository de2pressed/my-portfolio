/**
 * Parameterized 3D tilt (hover) effect for the music player.
 *
 * - Uses a document-level `mousemove` listener (not element-level)
 *   so the transform wrapper can safely have `pointer-events: none`.
 * - Drives transform updates via requestAnimationFrame with lerp smoothing.
 * - Eases out to flat on mouse leave.
 * - Returns a `destroy()` function for cleanup.
 */

export type TiltConfig = {
  maxRotation: number;
  perspective: number;
  lerpFactor: number;
  easeOutDuration: number;
  enableSpecular?: boolean;
  maxSpecularOpacity?: number;
};

export type TiltHandle = {
  destroy: () => void;
  setConfig: (config: TiltConfig) => void;
};

export function createTiltEffect(
  element: HTMLElement,
  config: TiltConfig,
): TiltHandle {
  let active = true;
  let currentConfig = config;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let isHovering = false;
  let easeOutStart = 0;
  let easeOutFrom = { x: 0, y: 0 };
  let easingOut = false;
  let rafId = 0;

  function ensureLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!active) return;

    const rect = element.getBoundingClientRect();
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (isInside) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const halfW = rect.width / 2 || 1;
      const halfH = rect.height / 2 || 1;

      target.x = (dx / halfW) * currentConfig.maxRotation;
      target.y = -(dy / halfH) * currentConfig.maxRotation;

      if (!isHovering) {
        isHovering = true;
        easingOut = false;
      }
      ensureLoop();
    } else if (isHovering) {
      isHovering = false;
      easingOut = true;
      easeOutStart = performance.now();
      easeOutFrom = { x: current.x, y: current.y };
      ensureLoop();
    }
  }

  function tick() {
    if (!active) {
      rafId = 0;
      return;
    }

    if (easingOut) {
      const elapsed = performance.now() - easeOutStart;
      const progress = Math.min(1, elapsed / currentConfig.easeOutDuration);
      const eased = 1 - Math.pow(1 - progress, 3);

      current.x = easeOutFrom.x * (1 - eased);
      current.y = easeOutFrom.y * (1 - eased);

      if (progress >= 1) {
        easingOut = false;
        current.x = 0;
        current.y = 0;
      }
    } else if (isHovering) {
      current.x += (target.x - current.x) * currentConfig.lerpFactor;
      current.y += (target.y - current.y) * currentConfig.lerpFactor;
    }

    element.style.transform = `perspective(${currentConfig.perspective}px) rotateX(${current.y}deg) rotateY(${current.x}deg)`;

    if (isHovering || easingOut) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }

  document.addEventListener("mousemove", onMouseMove, { passive: true });

  return {
    destroy() {
      active = false;
      document.removeEventListener("mousemove", onMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      element.style.transform = "";
    },
    setConfig(newConfig: TiltConfig) {
      currentConfig = newConfig;
    },
  };
}
