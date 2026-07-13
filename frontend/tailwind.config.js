/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#f1f5f9',      // Sleek silver-blue white
          card: '#ffffff',    // Solid white
          border: '#cbd5e1',  // Silver border
          text: '#0f172a',    // Dark slate text
          muted: '#475569'    // Medium slate text
        },
        primary: {
          light: '#6366f1',   // Indigo light
          DEFAULT: '#4f46e5', // Indigo primary
          dark: '#3730a3'     // Indigo dark
        },
        accent: {
          light: '#2dd4bf',   // Teal light
          DEFAULT: '#0d9488', // Teal primary
          dark: '#0f766e'     // Teal dark
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'glass-glow-light': '0 8px 32px 0 rgba(79, 70, 229, 0.12)',
      }
    },
  },
  plugins: [],
}
