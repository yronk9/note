module.exports = {
  purge: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./src/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'sky-light': '#E6F3FF',
        'sky-medium': '#B3D9FF',
        'sky-dark': '#80BFFF',
        'cloud-white': '#FFFFFF',
        'cloud-light': '#F0F8FF',
        'cloud-dark': '#E1EBFA',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  };