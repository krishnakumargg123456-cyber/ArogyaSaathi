/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0F9F5",
          100: "#E1F2EC",
          200: "#C3E5D9",
          300: "#95D1BD",
          400: "#5FB79C",
          500: "#389D7E",
          600: "#1F7E63",
          700: "#16644F",
          800: "#0F5B47",
          900: "#0A4333",
          950: "#05271E",
        },
        mint: {
          50: "#F4FBF8",
          100: "#E8F5F0",
          200: "#D1EAE0",
          300: "#B0DACB",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Noto Sans Devanagari",
          "sans-serif",
        ],
      },
      boxShadow: {
        premium: "0 10px 30px -5px rgba(10, 67, 51, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 20px 35px -10px rgba(10, 67, 51, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
