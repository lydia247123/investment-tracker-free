/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gradient-start': '#6DD98A',
        'apple-gradient-end': '#6DD98A',
      },
      backgroundImage: {
        'apple-gradient': 'linear-gradient(135deg, #6DD98A 0%, #6DD98A 100%)',
      },
    },
  },
  plugins: [],
}
