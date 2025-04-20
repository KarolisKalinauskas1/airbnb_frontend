/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'airbnb-red': '#FF385C',
        'airbnb-light': '#FF5A5F',
        'airbnb-dark': '#E31C5F',
      },
      boxShadow: {
        'card': '0 6px 16px rgba(0,0,0,0.12)',
        'header': '0 2px 4px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
