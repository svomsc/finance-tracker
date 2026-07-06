/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#10b981',
        danger: '#ef4444',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
