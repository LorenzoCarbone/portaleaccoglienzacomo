/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: {
          50: '#f0fdf7',
          100: '#d9fbe8',
          200: '#b3f4d1',
          300: '#7fe8b5',
          400: '#4cd596',
          500: '#26b879',
          600: '#1a9560',
          700: '#16764d',
          800: '#145e3f',
          900: '#124d35',
        },
        warm: {
          50: '#fdf8f6',
          500: '#f97316',
          600: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}
