import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg: {
          primary:   "#080810",
          secondary: "#0D0D18",
          card:      "#121220",
          elevated:  "#181828",
          hover:     "#1E1E32",
        },
        accent: {
          cyan:   "#22D3EE",
          purple: "#A78BFA",
          green:  "#34D399",
          amber:  "#FBBF24",
          red:    "#F87171",
          pink:   "#F472B6",
        },
        border: {
          subtle:  "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.07)",
          bright:  "rgba(255,255,255,0.13)",
        },
        text: {
          primary:   "#EEEEF8",
          secondary: "#7878A0",
          muted:     "#3E3E60",
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.25s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "cyan-sm":   "0 0 16px rgba(34,211,238,0.14)",
        "cyan-md":   "0 0 32px rgba(34,211,238,0.18)",
        "purple-sm": "0 0 16px rgba(167,139,250,0.14)",
        "card":      "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
