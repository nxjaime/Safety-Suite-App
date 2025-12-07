/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'idelic-blue': '#0056b3', // Example custom color
      }
    },
  },
  plugins: [],
}
