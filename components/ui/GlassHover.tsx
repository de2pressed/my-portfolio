"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

type TiltConfig = {
  maxRotation: number;
  perspective: number;
  intensity: number;
  springStiffness: number;
  springDamping: number;
  sheenOpacity: number;
  enableSheen: boolean;
};

type GlassHoverProps = {
  children: ReactNode;
  className?: string;
  config?: TiltConfig;
  disabled?: boolean;
  // Backward compatibility props
  intensity?: number;
  maxRotation?: number;
  perspective?: number;
};

export function GlassHover({ children, className = "", config, disabled = false, intensity = 1, maxRotation = 12, perspective = 500 }: GlassHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Use config if provided, otherwise fall back to individual props for backward compatibility
  const effectiveConfig: TiltConfig = config || {
    maxRotation,
    perspective,
    intensity,
    springStiffness: 150,
    springDamping: 25,
    sheenOpacity: 0.6,
    enableSheen: true,
  };

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [effectiveConfig.maxRotation, -effectiveConfig.maxRotation]),
    { stiffness: effectiveConfig.springStiffness, damping: effectiveConfig.springDamping }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-effectiveConfig.maxRotation, effectiveConfig.maxRotation]),
    { stiffness: effectiveConfig.springStiffness, damping: effectiveConfig.springDamping }
  );

  const sheenX = useTransform(mouseX, [-0.5, 0.5], [100, 0]);
  const sheenY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current || disabled) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = (event.clientX - rect.left) / width - 0.5;
    const mouseYVal = (event.clientY - rect.top) / height - 0.5;

    mouseX.set(mouseXVal * effectiveConfig.intensity);
    mouseY.set(mouseYVal * effectiveConfig.intensity);

    // Set CSS variables for sheen gradient
    const percentX = ((event.clientX - rect.left) / width) * 100;
    const percentY = ((event.clientY - rect.top) / height) * 100;
    ref.current.style.setProperty('--mouse-x', `${percentX}%`);
    ref.current.style.setProperty('--mouse-y', `${percentY}%`);
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
        perspective: effectiveConfig.perspective,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
        {effectiveConfig.enableSheen && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
            style={{
              background: "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.15) 0%, transparent 50%)",
              opacity: effectiveConfig.sheenOpacity,
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                x: sheenX,
                y: sheenY,
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Preset configurations for different contexts
export const MINIMAL_CONFIG: TiltConfig = {
  maxRotation: 5,
  perspective: 900,
  intensity: 0.6,
  springStiffness: 100,
  springDamping: 30,
  sheenOpacity: 0.15,
  enableSheen: true,
};

export const BALANCED_CONFIG: TiltConfig = {
  maxRotation: 7,
  perspective: 725,
  intensity: 1.0,
  springStiffness: 120,
  springDamping: 35,
  sheenOpacity: 0.25,
  enableSheen: true,
};
