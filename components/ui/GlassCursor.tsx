"use client";

import { useEffect, useRef } from "react";

export function GlassCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: -100, y: -100, tx: -100, ty: -100 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let frame = 0;

    const updatePosition = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
    };

    const tick = () => {
      const state = pointer.current;
      state.tx += (state.x - state.tx) * 0.24;
      state.ty += (state.y - state.ty) * 0.24;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${state.tx - 16}px, ${state.ty - 16}px, 0)`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", updatePosition);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", updatePosition);
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
      }}
    />
  );
}
