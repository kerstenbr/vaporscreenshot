/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#150821",
        dusk: "#22103e",
        panel: "#2b1450",
        "neon-pink": "#ff3ec9",
        "neon-cyan": "#2ee6ff",
        "sunset-orange": "#ff9142",
        "grid-violet": "#7b42ff",
        foam: "#f5f0ff",
      },
      fontFamily: {
        display: [
          '"Century Gothic"',
          '"Trebuchet MS"',
          '"Futura"',
          "system-ui",
          "sans-serif",
        ],
        body: [
          '"Segoe UI"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          '"Consolas"',
          '"SFMono-Regular"',
          '"Liberation Mono"',
          "monospace",
        ],
      },
      boxShadow: {
        neon: "0 0 12px rgba(255,62,201,0.55), 0 0 32px rgba(123,66,255,0.35)",
        "neon-cyan": "0 0 12px rgba(46,230,255,0.55), 0 0 32px rgba(46,230,255,0.25)",
      },
      keyframes: {
        scanline: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 24px" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        scanline: "scanline 3s linear infinite",
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
