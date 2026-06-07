/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(148, 163, 184, 0.12), 0 20px 80px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
};