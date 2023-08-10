import fs from 'fs';
import path from 'path';
import { match, compile } from 'path-to-regexp';

/*
* rewrite directory structure before
* generating static site so that
* (1) repo file names can be the more informative `[name]_docs.md`
* (2) routes can be simplified
*/

export const rewrites = {
	'{:name}_docs.md': 'index.md', // rewrite root-level `[name]_docs.md`
	':path(.*)/{:name}_index.md': ':path/index.md', // `/datacite/datacite_docs_index.md` => `/datacite/index.hmtl`
	':path(.*)/{:nameSpace}_{:name}_docs.md': ':path/:name.md', // `/datacite/datacite_oauth_docs.md` => `/datacite/oauth.hmtl`
};

const rewritePath = (pagePath: string): string => {
	const rewriteRules = Object.entries(rewrites || {}).map(([from, to]) => ({
		toPath: compile(`/${to}`, { validate: false }),
		matchUrl: match(from.startsWith('^') ? new RegExp(from) : from)
	}))

	if (rewriteRules.length) {
		for (const { matchUrl, toPath } of rewriteRules) {
			const res = matchUrl(pagePath)
			if (res) {
				return toPath(res.params).slice(1)
			}
		}
	}
	return pagePath; // no matched rewrite rule
}

type NodeInfo = null | {
	collapsed?: boolean;
	link?: string;
	text: string;
	items?: any;
}

// only roll up md files
const fileExtensions = /\.(md|mkd|mdwn|mdown|mdtxt|mdtext|markdown|text)$/;

// only roll up files (and be extension, directories containing files) which contain one of the following
const filters = [
	/_docs/,
];

// add regex matches here will be omitted from sidebar nav
const exclusions = [
	/core/,
	/node_modules/,
	/cache/,
	/dist/,
];

// do: beautify text for links
// by: take basename of path, replace _ with spaces and drop `docs/index`
// eg: oauth_docs_index.md => oauth
const getText = (filename: string) => path
	.basename(filename)
	.replace(/_(docs|index)/g, '')
	.replace('_', ' ')
	.replace(fileExtensions, '');

export const dirTree = (filename: string): NodeInfo => {
	const stats = fs.lstatSync(filename);
	const extension = path.extname(filename).toLowerCase();

	const inty = /integration/.test(filename);
	const isDirectory = stats.isDirectory();
	const isExcluded = exclusions.some((exclusion) => exclusion.test(filename));
	const isMatchedName = filters.some((filter) => filter.test(filename));
	const isMatchedExtension = fileExtensions.test(extension);

	if (isDirectory && !isExcluded) {
		const node = {
			link: rewritePath(path.join(filename, '/index.md')),
			text: getText(filename),
			collapsed: false,
		}
		const children = fs.readdirSync(filename).reduce((items: NodeInfo[], child: string) => {
			const childTree = dirTree(path.join(filename, child));
			return childTree ? [...items, childTree] : items; // if child tree null, don't add to items
		}, []);
		const indexFile = children.find((item) => item?.link === node.link);
		const items = children.filter((item) => item?.link !== node.link);
		if (inty) console.log({
			children,
			items,
			node,
			indexFile,
		});
		return (!indexFile && !items.length)
			? null
			: (indexFile)
				? node
				: { ...node, items }
	} else if (isMatchedName && isMatchedExtension) {
		return {
			link: rewritePath(filename),
			text: getText(filename),
		}
	} else {
		return null
	}
}
