/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'idelic-blue': '#0056b3',
        slate: {
          25: '#f8fafc',
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#0b1220',
        },
        safety: {
          green: '#16a34a',
          amber: '#f59e0b',
          red: '#dc2626',
        },
      },
      fontFamily: {
        heading: ['\"Space Grotesk\"', 'ui-sans-serif', 'system-ui'],
        body: ['\"Inter\"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
