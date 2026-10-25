/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { utm: { 600: '#0f59c7', 700: '#0a47a7', 900: '#0b2855' } } } },
  plugins: []
};
