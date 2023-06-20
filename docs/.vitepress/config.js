export default {
	title: "Technical Reference",
	description: "Technical Reference for building and maintaining PubPub.",
	cleanUrls: "without-subfolders",
	head: [["link", { rel: "icon", href: "/icon.svg" }]],
	themeConfig: {
		siteTitle: "Technical Reference",
		logo: { light: "/logoDark.svg", dark: "/logoLight.svg" },
		nav: [{ text: "v7.pubpub.org", link: "https://v7.pubpub.org" }],
		sidebar: [
			{
				text: "About the Project",
				items: [
					{ text: "Introduction", link: "/" },
				],
			},
			{
				text: "Pubs",
				items: [
					{ text: "Overview", link: "/pubs" },
					{ text: "Types", link: "/pubTypes" },
				],
			},
			{
				text: "Workflows",
				items: [
					{ text: "Overview", link: "/workflows" },
					
				],
			},
			{
				text: "Integrations",
				items: [
					{ text: "Overview", link: "/integrations" },
					
				],
			},
		],
		socialLinks: [{ icon: "github", link: "https://github.com/pubpub/pubpub" }],
	},
};
