/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          light: "#f3e8ff",
          DEFAULT: "#b57edc",
          dark: "#7c5295",
          accent: "#c3aed6",
          muted: "#e0bbec"
        }
      }
    }
  },
  plugins: [],
}