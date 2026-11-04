/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sepia: {
          50: '#fbf9f4',
          100: '#f6f1e7',
          200: '#ebdcc5',
          300: '#dfc49e',
          400: '#cfa574',
          500: '#bd8853',
          600: '#a36d41',
          700: '#835237',
          800: '#6d4231',
          900: '#43281c',
          950: '#2c1810',
        }
      },
      fontFamily: {
        literata: ['"Literata"', 'Merriweather', 'Georgia', 'serif'],
        lora: ['"Lora"', 'Georgia', 'serif'],
        serif: ['"Merriweather"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        cinzel: ['"Cinzel"', 'serif'],
        chinese: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans CJK SC"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
