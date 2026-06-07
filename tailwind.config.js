/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Sora"', 'ui-sans-serif', 'sans-serif'],
        body: ['"Sora"', '"Manrope"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 16px 40px -24px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
}
