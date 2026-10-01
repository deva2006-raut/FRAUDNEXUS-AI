import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04070D",
          900: "#070C16",
          850: "#0A111F",
          800: "#0E1628",
          700: "#16223A",
          600: "#1E2F4D",
        },
        ink: {
          100: "#E9F0FB",
          200: "#C7D3E8",
          300: "#94A5C4",
          400: "#5F729A",
          500: "#3D4E70",
        },
        cyanx: {
          300: "#7DF3FF",
          400: "#38E1F5",
          500: "#0FB9D6",
          600: "#0A8CA6",
        },
        danger: { 400: "#FF6B6B", 500: "#F04A4A", 600: "#D63A3A" },
        warn: { 400: "#FFA94D", 500: "#F58A2E" },
        safe: { 400: "#4ADE9C", 500: "#22C58A" },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        panel: "0 10px 40px -12px rgba(0,0,0,0.55)",
        glowc: "0 0 0 1px rgba(56,225,245,0.18), 0 0 32px -8px rgba(56,225,245,0.25)",
        glows: "0 0 0 1px rgba(255,90,90,0.22), 0 0 32px -8px rgba(255,90,90,0.28)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        flowDash: {
          to: { strokeDashoffset: "-20" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        gridPan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "48px 48px" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease both",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        flowDash: "flowDash 1s linear infinite",
        spinSlow: "spinSlow 8s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
        gridPan: "gridPan 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
