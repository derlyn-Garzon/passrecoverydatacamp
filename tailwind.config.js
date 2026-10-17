/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          bg: '#0F172A',
          card: '#1E293B',
          cardHover: '#334155',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
          accent: '#10B981',
          accentHover: '#059669',
          accentLight: '#34D399',
          danger: '#EF4444',
          warning: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
