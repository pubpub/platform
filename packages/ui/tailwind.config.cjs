/** @type {import("tailwindcss").Config} */

/* We likely want to export a tailwind plugin, rather than
using `preset` in consuming apps. Explanation here: 
https://stackoverflow.com/questions/72388980/consuming-a-component-library-that-uses-tailwindcss
*/

module.exports = {
	darkMode: ["class"],
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		container: {
			center: "true",
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				destructive: "var(--destructive)",
				"destructive-foreground": "var(--destructive-foreground)",
				background: "var(--background)",
				foreground: "var(--foreground)",
				card: "var(--card)",
				"card-foreground": "var(--card-foreground)",
				primary: "var(--primary)",
				"primary-foreground": "var(--primary-foreground)",
				popover: "var(--popover)",
				"popover-foreground": "var(--popover-foreground)",
				secondary: "var(--secondary)",
				"secondary-foreground": "var(--secondary-foreground)",
				muted: "var(--muted)",
				"muted-foreground": "var(--muted-foreground)",
				accent: "var(--accent)",
				"accent-foreground": "var(--accent-foreground)",
				input: "var(--input)",
				border: "var(--border)",
				ring: "var(--ring)",
				sidebar: {
					DEFAULT: "var(--sidebar)",
					foreground: "var(--sidebar-foreground)",
					primary: "var(--sidebar-primary)",
					"primary-foreground": "var(--sidebar-primary-foreground)",
					accent: "var(--sidebar-accent)",
					"accent-foreground": "var(--sidebar-accent-foreground)",
					border: "var(--sidebar-border)",
					ring: "var(--sidebar-ring)",
					active: "var(--sidebar-active)",
				},
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
				"collapsible-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-collapsible-content-height)",
					},
				},
				"collapsible-up": {
					from: {
						height: "var(--radix-collapsible-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"collapsible-down": "collapsible-down 0.2s ease-out",
				"collapsible-up": "collapsible-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
