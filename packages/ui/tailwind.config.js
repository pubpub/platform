/** @type {import('tailwindcss').Config} */

/* We likely want to export a tailwind plugin, rather than
using `preset` in consuming apps. Explanation here: 
https://stackoverflow.com/questions/72388980/consuming-a-component-library-that-uses-tailwindcss
*/

module.exports = {
	darkMode: ["class"],
	content: ["./src/*.{js,jsx,ts,tsx}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			keyframes: {
				"accordion-down": {
					from: { height: 0 },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: 0 },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};
