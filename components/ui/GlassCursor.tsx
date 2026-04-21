"use client";

import { useEffect, useRef } from "react";

const DEFAULT_SIZE = 18;
const HOVER_SIZE = 24;
const TIP_OFFSET_X = 1.2;
const TIP_OFFSET_Y = 0.8;

export function GlassCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: -100, y: -100, tx: -100, ty: -100 });
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
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[200] hidden md:block"
      style={{
        willChange: "transform, width, height, opacity, filter",
        transition:
          "width 160ms ease, height 160ms ease, opacity 160ms ease, filter 160ms ease",
      }}
    >
      <svg
        aria-hidden="true"
        className="block h-full w-full"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M2 1.5V22.5L7.4 17.1L10.8 23.3L13.1 22.1L9.8 16.1H19L2 1.5Z"
          fill="rgb(var(--ink-rgb))"
          stroke="rgba(255,255,255,0.88)"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
