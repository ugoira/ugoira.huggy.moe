module.exports = {
  purge: [
    './src/**/*.eft',
    './src/**/main.css',
    './index.html',
  ],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#ff69b4',
        sprimary: '#16A34A'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
