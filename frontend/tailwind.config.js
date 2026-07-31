/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#eef0e8',
        paper: '#0b0d0b',
        stone: '#969d92',
        surface: '#131612',
        muted: '#1a1e18',
        line: '#2b3029',
        acid: '#d7ff45',
        danger: '#ff715f',
      },
      fontFamily: {
        sans: ['Inter', 'Aptos', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        display: ['Iowan Old Style', 'Palatino Linotype', 'Noto Serif SC', 'Songti SC', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
