"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

type GlassHoverProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
  maxRotation?: number;
};

export function GlassHover({ children, className = "", intensity = 1, maxRotation = 8 }: GlassHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [maxRotation, -maxRotation]),
    { stiffness: 300, damping: 30 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-maxRotation, maxRotation]),
    { stiffness: 300, damping: 30 }
  );

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = (event.clientX - rect.left) / width - 0.5;
    const mouseYVal = (event.clientY - rect.top) / height - 0.5;

    mouseX.set(mouseXVal * intensity);
    mouseY.set(mouseYVal * intensity);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
