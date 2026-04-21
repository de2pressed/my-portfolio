import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        warm: "rgb(var(--warm-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        borderGlass: "rgb(var(--glass-border-rgb) / <alpha-value>)",
      },
      boxShadow: {
        glass: "0 18px 60px rgba(34, 28, 22, 0.14), inset 0 1px 0 rgba(255,255,255,0.45)",
        glow: "0 0 0 1px rgba(255,255,255,0.18), 0 24px 80px rgba(58, 45, 33, 0.18)",
      },
      backdropBlur: {
        xs: "4px",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        drift: "drift 16s ease-in-out infinite",
        pulseAura: "pulseAura 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -12px, 0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(16px, -18px, 0) scale(1.04)" },
        },
        pulseAura: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.07)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
