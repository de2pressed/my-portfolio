"use client";

import type { PropsWithChildren } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 32, scale: 0.985, filter: "blur(20px)", rotateX: 2 }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", rotateX: 0 }}
        exit={{ opacity: 0, y: -18, scale: 0.99, filter: "blur(18px)", rotateX: -2 }}
        transition={{
          duration: 0.78,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
