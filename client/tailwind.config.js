/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#F59E0B', // Amber
          dark: '#B45309',
        },
        dark: '#1F2937',
        success: '#10B981',
        danger: '#EF4444',
        text: '#1F2937',
        'light-bg': '#F9FAFB',
        border: '#E5E7EB',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
