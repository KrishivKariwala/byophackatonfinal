import type { Config } from "tailwindcss";

// Tokens sampled from the visible swatches of the official mood board.
// The printed HEX captions on the mood board disagree with the swatches; see README.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tomato: "#CB0001",
        coral: "#FD2828",
        burgundy: "#790000",
        peach: "#FDD599",
        cream: "#FEF2C0",
        canvas: "#F6F5F3",
        logobg: "#FBF0D5",
        ink: "#2A0A0A",
        muted: "#6B4A4A",
        line: "#E2D6C6",
        sand: "#EDE6DC",
        veg: "#1F7A3A",
        nonveg: "#8A2A00",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        editorial: ['"The Seasons"', '"Cormorant Garamond"', "Georgia", "serif"],
        display: ['"Chunko Bold"', '"Bagel Fat One"', "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
