/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Оцей рядок каже Tailwind шукати класи у твоїх файлах!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}