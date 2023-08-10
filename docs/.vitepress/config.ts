import { defineConfig, DefaultTheme } from 'vitepress'

import { dirTree, rewrites } from './routerUtil';

type MaybeNavItem = DefaultTheme.NavItem | null;

const sidebarDirTrees = [
	'../integrations',
	'../packages',
	'../docs',
	'../core',
].map((path) => dirTree(path) as DefaultTheme.NavItem)
	.reduce((dirTrees: MaybeNavItem[], maybeTree) => {
		return maybeTree ? [...dirTrees, maybeTree] : dirTrees;
	}, []) as DefaultTheme.NavItem[];

export default defineConfig({
	title: 'PubPub Documentation',
	description: 'Documentation for PubPub Core API, Integrations, Packages',
	cleanUrls: true,
	vite: { build: { rollupOptions: { external: ['vue/server-renderer', 'vue'] } }, }, // this fantastically suspect line allows setting srcDir as parent directory
	srcDir: '..',
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Dev Docs', link: '/docs/' },
			{ text: 'Changelog', link: '/changelog/' },
		],
		sidebar: sidebarDirTrees,
		outlineTitle: 'On this page',
		outline: 2,
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/pubpub/pubpub' }
		]
	},
	srcExclude: ['**/(README|Readme).md', '**/(TODO|Todo).md'],
	ignoreDeadLinks: true,
	rewrites,
});
