import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ children, className }: GlassCardProps) {
  return <div className={cn("glass-panel rounded-[30px]", className)}>{children}</div>;
}
