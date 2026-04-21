"use client";

import { useEffect, useRef } from "react";

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

      cursorRef.current.style.width = interactive.current ? "44px" : "32px";
      cursorRef.current.style.height = interactive.current ? "44px" : "32px";
      cursorRef.current.style.opacity = interactive.current ? "0.78" : "1";
      cursorRef.current.style.backgroundColor = interactive.current
        ? "rgba(255,255,255,0.14)"
        : "rgba(255,255,255,0.20)";
      cursorRef.current.style.boxShadow = interactive.current
        ? "0 0 0 1px rgba(255,255,255,0.28), 0 0 28px rgba(var(--accent-rgb), 0.18), inset 0 1px 0 rgba(255,255,255,0.5)"
        : "0 0 0 1px rgba(255,255,255,0.2), 0 0 24px rgba(var(--accent-rgb), 0.22), inset 0 1px 0 rgba(255,255,255,0.44)";
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
        const size = interactive.current ? 44 : 32;
        cursorRef.current.style.transform = `translate3d(${state.tx - size / 2}px, ${state.ty - size / 2}px, 0)`;
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
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-8 w-8 rounded-full border border-white/60 bg-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_12px_40px_rgba(61,44,27,0.16)] backdrop-blur-md md:block"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.2), 0 0 24px rgba(var(--accent-rgb), 0.22), inset 0 1px 0 rgba(255,255,255,0.44)",
        transition:
          "width 180ms ease, height 180ms ease, opacity 180ms ease, background-color 180ms ease, box-shadow 180ms ease",
        willChange: "transform, width, height, opacity, background-color, box-shadow",
      }}
    />
  );
}
