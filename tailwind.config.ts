import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hedge-fund / Bloomberg-terminal dark theme. No yellow.
        bg: {
          DEFAULT: "#0A0C10", // near-black app background
          soft: "#0F1115",
        },
        panel: {
          DEFAULT: "#13161C", // cards / panels
          soft: "#181C24",
          hover: "#1E232C",
        },
        border: {
          DEFAULT: "#242A34",
          soft: "#1B2029",
        },
        ink: {
          DEFAULT: "#E6EAF0", // primary text
          soft: "#9BA4B2", // secondary text
          dim: "#6B7280", // tertiary / labels
        },
        // Cold steel-blue / cyan accent — the "ultra pro" signature
        accent: {
          DEFAULT: "#4EA8DE",
          bright: "#6EC1F0",
          deep: "#2E6F9E",
          glow: "rgba(78,168,222,0.16)",
        },
        win: {
          DEFAULT: "#3FB78B", // calm emerald for gains
          soft: "rgba(63,183,139,0.14)",
        },
        loss: {
          DEFAULT: "#E2575B", // controlled red for losses
          soft: "rgba(226,87,91,0.14)",
        },
        be: {
          DEFAULT: "#8A93A2", // break-even neutral grey
          soft: "rgba(138,147,162,0.14)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(78,168,222,0.25), 0 8px 30px -8px rgba(78,168,222,0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
