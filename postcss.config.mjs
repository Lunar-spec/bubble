const config = {
  plugins: {
    "@tailwindcss/postcss": {
      extend: {
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        }
      }
    },
  },
};
export default config;