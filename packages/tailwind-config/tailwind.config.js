/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "src/**/*.{js,ts,jsx,tsx}",
	"app/**/*.{ts,tsx}",
    // include packages if not transpiling
    // "../../packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
    },
  },
  plugins: [],
};
