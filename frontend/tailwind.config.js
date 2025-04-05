/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  presets: [require('tailwindcss/defaultConfig')],
  theme: {
    extend: {},
  },
  plugins: [],
}
