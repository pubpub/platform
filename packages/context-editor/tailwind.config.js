// /** @type {import('tailwindcss').Config} */
// module.exports = {
// 	content: ["./src/**/*.{ts,tsx}"],
// 	theme: {
// 	  extend: {},
// 	},
// 	plugins: [],
//   }

const path = require("path");
const sharedConfig = require("ui/tailwind.config.js");
const packagePath = (id) => path.dirname(require.resolve(`${id}/package.json`));
const packageSource = (id) => path.join(packagePath(id), "src", "**/*.{ts,tsx}");

/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [sharedConfig],
	plugins: [require("@tailwindcss/forms"), require('@tailwindcss/typography'),],
	content: ["./src/**/*.{ts,tsx}", packageSource("ui")],
	theme: {
		extend: {
			colors: {
				destructive: "hsl(var(--destructive))",
				"destructive-foreground": "hsl(var(--destructive-foreground))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: "hsl(var(--card))",
				"card-foreground": "hsl(var(--card-foreground))",
				primary: "hsl(var(--primary))",
				"primary-foreground": "hsl(var(--primary-foreground))",
				popover: "hsl(var(--popover))",
				"popover-foreground": "hsl(var(--popover-foreground))",
				secondary: "hsl(var(--secondary))",
				"secondary-foreground": "hsl(var(--secondary-foreground))",
				muted: "hsl(var(--muted))",
				"muted-foreground": "hsl(var(--muted-foreground))",
				accent: "hsl(var(--accent))",
				"accent-foreground": "hsl(var(--accent-foreground))",
				input: "hsl(var(--input))",
				border: "hsl(var(--border))",
				ring: "hsl(var(--ring))",
			},
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
};
