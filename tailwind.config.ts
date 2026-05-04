import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        rune: "0 0 22px rgba(168, 85, 247, 0.38)",
        coin: "0 0 18px rgba(251, 191, 36, 0.35)"
      },
      fontFamily: {
        pixel: ["Press Start 2P", "Silkscreen", "Courier New", "monospace"],
        display: ["Press Start 2P", "Silkscreen", "Courier New", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
