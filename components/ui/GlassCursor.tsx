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
  const pointer = useRef({ x: -100, y: -100, tx: -100, ty: -100, vx: 0, vy: 0 });
  const trailStates = useRef(Array.from({ length: TRAIL_COUNT }, () => ({ tx: -100, ty: -100, vx: 0, vy: 0 })));
  const interactive = useRef(false);
  const isPressed = useRef(false);
  const rotation = useRef(0);
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
      const prevX = pointer.current.x;
      const prevY = pointer.current.y;
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      
      // Calculate velocity for rotation
      const dx = pointer.current.x - prevX;
      const dy = pointer.current.y - prevY;
      pointer.current.vx = dx;
      pointer.current.vy = dy;
      
      // Calculate rotation based on movement direction
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        const targetRotation = Math.atan2(dy, dx) * (180 / Math.PI);
        rotation.current += (targetRotation - rotation.current) * 0.15;
      }
    };

    const handlePointerDown = () => {
      isPressed.current = true;
    };

    const handlePointerUp = () => {
      isPressed.current = false;
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
      
      // Spring physics for main cursor
      const stiffness = 0.24;
      const damping = 0.82;
      const ax = (state.x - state.tx) * stiffness;
      const ay = (state.y - state.ty) * stiffness;
      state.vx = (state.vx + ax) * damping;
      state.vy = (state.vy + ay) * damping;
      state.tx += state.vx;
      state.ty += state.vy;

      // Apply press animation
      const pressScale = isPressed.current ? 0.85 : 1;
      const pressRotation = isPressed.current ? -15 : 0;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${state.tx - TIP_OFFSET_X}px, ${state.ty - TIP_OFFSET_Y}px, 0) rotate(${rotation.current + pressRotation}deg) scale(${pressScale})`;
      }

      // Spring physics for trail with momentum
      for (let index = 0; index < TRAIL_COUNT; index += 1) {
        const trail = trailStates.current[index];
        const target = index === 0 ? state : trailStates.current[index - 1];
        const speed = TRAIL_SPEEDS[index] ?? 0.05;
        
        // Spring physics for each trail segment
        const tax = (target.tx - trail.tx) * speed;
        const tay = (target.ty - trail.ty) * speed;
        trail.vx = (trail.vx + tax) * 0.9;
        trail.vy = (trail.vy + tay) * 0.9;
        trail.tx += trail.vx;
        trail.ty += trail.vy;

        const node = trailRefs.current[index];
        if (!node) {
          continue;
        }

        const distance = Math.hypot(state.tx - trail.tx, state.ty - trail.ty);
        const distanceFade = clamp(1 - distance / 80, 0, 1);
        const baseFade = clamp(0.4 - index * 0.06, 0.08, 0.4);
        const opacity = interactive.current ? 0 : distanceFade * baseFade;
        const size = 12 - index * 1.4;

        // Color gradient based on position
        const hue = (state.tx / window.innerWidth) * 60 + 280; // Purple to pink range
        const color = `hsla(${hue}, 70%, 60%, ${opacity.toFixed(3)})`;

        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        node.style.transform = `translate3d(${trail.tx - size / 2}px, ${trail.ty - size / 2}px, 0)`;
        node.style.opacity = `${opacity.toFixed(3)}`;
        node.style.background = color;
        node.style.boxShadow = `0 0 ${10 + index * 2}px ${color}`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    bindInteractiveTargets();
    syncCursorStyle();

    window.addEventListener("pointermove", updatePosition);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    frame = window.requestAnimationFrame(tick);

    const observer = new MutationObserver(bindInteractiveTargets);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener("pointermove", updatePosition);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
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
            willChange: "transform, width, height, opacity, box-shadow, background",
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
