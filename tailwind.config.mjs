/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a", // Negro profundo
        brand: {
          light: "#a855f7", // Morado claro
          DEFAULT: "#7c3aed", // Morado principal
          dark: "#4c1d95", // Morado oscuro
        },
      },
    },
  },
  plugins: [],
};
export default config;