import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";

import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "PubPub Platform Developers Docs",
	tagline: "Documentation for the PubPub Platform for developers",
	favicon: "img/logo.svg",

	// Set the production url of your site here
	url: "https://your-docusaurus-site.example.com",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	headTags: [
		{
			tagName: "link",
			attributes: {
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist+Sans:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500&display=swap",
			},
		},
	],
	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "pubpub", // Usually your GitHub org/user name.
	projectName: "platform", // Usually your repo name.

	onBrokenLinks: "warn",
	onBrokenMarkdownLinks: "warn",
	future: {
		experimental_faster: true,
	},

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl: "https://github.com/pubpub/platform/tree/main/docs",
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],
	plugins: [require.resolve("@easyops-cn/docusaurus-search-local")],

	themeConfig: {
		// Replace with your project's social card
		image: "img/docusaurus-social-card.jpg",
		navbar: {
			title: "PubPub Developer Docs",
			logo: {
				alt: "PubPub Logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "tutorialSidebar",
					position: "left",
					label: "Docs",
				},
				{
					href: "https://github.com/pubpub/platform",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Docs",
							to: "/docs/intro",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/pubpub/platform",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Knowledge Futures Group. Built with Docusaurus.`,
		},
		prism: {
			additionalLanguages: ["bash"],
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
