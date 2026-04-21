"use client";

import { useEffect, useRef } from "react";

const DEFAULT_SIZE = 18;
const HOVER_SIZE = 24;
const TIP_OFFSET_X = 1.2;
const TIP_OFFSET_Y = 0.8;
const TRAIL_COUNT = 5;
const TRAIL_SPEEDS = [0.18, 0.14, 0.1, 0.075, 0.05];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function GlassCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointer = useRef({ x: -100, y: -100, tx: -100, ty: -100 });
  const trailStates = useRef(Array.from({ length: TRAIL_COUNT }, () => ({ tx: -100, ty: -100 })));
  const interactive = useRef(false);
  const bindings = useRef(
    new Map<
      Element,
      {
        enter: () => void;
        leave: () => void;
      }
    >(),
  );

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let frame = 0;

    const syncCursorStyle = () => {
      if (!cursorRef.current) {
        return;
      }

      const size = interactive.current ? HOVER_SIZE : DEFAULT_SIZE;
      cursorRef.current.style.width = `${size}px`;
      cursorRef.current.style.height = `${size}px`;
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.filter = interactive.current
        ? "drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.26)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.65))"
        : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.42))";
    };

    const updatePosition = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
    };

    const bindInteractiveTargets = () => {
      document.querySelectorAll("a, button, [role='button']").forEach((element) => {
        if (bindings.current.has(element)) {
          return;
        }

        const enter = () => {
          interactive.current = true;
          syncCursorStyle();
        };

        const leave = () => {
          interactive.current = false;
          syncCursorStyle();
        };

        element.addEventListener("pointerenter", enter);
        element.addEventListener("pointerleave", leave);
        bindings.current.set(element, { enter, leave });
      });
    };

    const tick = () => {
      const state = pointer.current;
      state.tx += (state.x - state.tx) * 0.24;
      state.ty += (state.y - state.ty) * 0.24;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${state.tx - TIP_OFFSET_X}px, ${state.ty - TIP_OFFSET_Y}px, 0)`;
      }

      for (let index = 0; index < TRAIL_COUNT; index += 1) {
        const trail = trailStates.current[index];
        const target = index === 0 ? state : trailStates.current[index - 1];
        const speed = TRAIL_SPEEDS[index] ?? 0.05;
        trail.tx += (target.tx - trail.tx) * speed;
        trail.ty += (target.ty - trail.ty) * speed;

        const node = trailRefs.current[index];
        if (!node) {
          continue;
        }

        const distance = Math.hypot(state.tx - trail.tx, state.ty - trail.ty);
        const distanceFade = clamp(1 - distance / 80, 0, 1);
        const baseFade = clamp(0.4 - index * 0.06, 0.08, 0.4);
        const opacity = interactive.current ? 0 : distanceFade * baseFade;
        const size = 12 - index * 1.4;

        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        node.style.transform = `translate3d(${trail.tx - size / 2}px, ${trail.ty - size / 2}px, 0)`;
        node.style.opacity = `${opacity.toFixed(3)}`;
        node.style.background = "rgba(var(--accent-rgb), 0.9)";
        node.style.boxShadow = `0 0 ${10 + index * 2}px rgba(var(--accent-rgb), ${Math.max(0.08, opacity * 0.65)})`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    bindInteractiveTargets();
    syncCursorStyle();

    window.addEventListener("pointermove", updatePosition);
    frame = window.requestAnimationFrame(tick);

    const observer = new MutationObserver(bindInteractiveTargets);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener("pointermove", updatePosition);
      observer.disconnect();
      bindings.current.forEach(({ enter, leave }, element) => {
        element.removeEventListener("pointerenter", enter);
        element.removeEventListener("pointerleave", leave);
      });
      bindings.current.clear();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200] hidden md:block">
      {Array.from({ length: TRAIL_COUNT }, (_, index) => (
        <div
          ref={(node) => {
            trailRefs.current[index] = node;
          }}
          key={index}
          className="absolute left-0 top-0 rounded-full"
          style={{
            opacity: 0,
            willChange: "transform, width, height, opacity, box-shadow",
          }}
        />
      ))}

      <div
        ref={cursorRef}
        className="absolute left-0 top-0"
        style={{
          willChange: "transform, width, height, opacity, filter",
          transition: "width 160ms ease, height 160ms ease, opacity 160ms ease, filter 160ms ease",
        }}
      >
        <svg aria-hidden="true" className="block h-full w-full" fill="none" viewBox="0 0 24 24">
          <path
            d="M2 1.5V22.5L7.4 17.1L10.8 23.3L13.1 22.1L9.8 16.1H19L2 1.5Z"
            fill="rgb(var(--ink-rgb))"
            stroke="rgba(255,255,255,0.88)"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </div>
  );
}
