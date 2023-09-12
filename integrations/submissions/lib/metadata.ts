import { normalizeDoi } from "../../../packages/utils/dist";
import { makeExtract } from "./html";

/**
 * Derive a pub from CSL-JSON.
 */
const derivePubFromCsl = (csl: any) => {
	return {
		Description: csl.abstract,
		DOI: csl.DOI,
		Title: csl.title,
		URL: csl.URL,
	};
};

/**
 * Derive a pub from a work returned by the Crossref API.
 */
const derivePubFromCrossrefWork = (work: any) => {
	return {
		Description: work.abstract,
		DOI: work.DOI,
		Title: Array.isArray(work.title) ? work.title[0] : work.title,
		URL: work.URL,
	};
};

/**
 * Derive the best guess of a pub by performing a reverse lookup of a
 * publication title using the Crossref API.
 */
export const makePubFromTitle = async (title: string) => {
	const response = await fetch(
		`https://api.crossref.org/works?rows=5&query.title=${encodeURIComponent(title)}`
	);
	if (!response.ok) {
		return null;
	}
	const {
		message: {
			items: [work],
		},
	} = await response.json();
	if (work !== undefined) {
		return derivePubFromCrossrefWork(work);
	}
	return null;
};

/**
 * Derive a pub from a DOI using doi.org.
 */
export const makePubFromDoi = async (doi: string) => {
	const response = await fetch(`https://doi.org/${doi}`, {
		headers: {
			Accept: "application/vnd.citationstyles.csl+json",
		},
	});
	if (!response.ok) {
		return null;
	}
	const csl = await response.json();
	return derivePubFromCsl(csl);
};

// Extraction rules for HTML metadata.
const extract = makeExtract(
	{
		mapTo: "Title",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "og:title",
		tagValueAttr: "content",
	},
	{
		mapTo: "Title",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "dc.title",
		tagValueAttr: "content",
	},
	{
		mapTo: "Description",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "og:description",
		tagValueAttr: "content",
	},
	{
		mapTo: "Description",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "description",
		tagValueAttr: "content",
	},
	{
		mapTo: "DOI",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "citation_doi",
		tagValueAttr: "content",
	},
	{
		mapTo: "DOI",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "dc.identifier",
		tagValueAttr: "content",
	},
	{
		mapTo: "URL",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "property",
		tagTypeAttrValue: "og:url",
		tagValueAttr: "content",
	},
	{
		mapTo: "URL",
		rank: 1,
		tagName: "link",
		tagTypeAttr: "rel",
		tagTypeAttrValue: "canonical",
		tagValueAttr: "href",
	}
);

const HTML_ENTITIES = /&(nbsp|amp|quot|lt|gt);/g;
const HTML_ENTITIES_TO_CHAR = {
	nbsp: " ",
	amp: "&",
	quot: '"',
	lt: "<",
	gt: ">",
};

/**
 * Replace HTML entities ("&nbsp;", "&amp;", etc.) with their corresponding
 * plaintext characters.
 */
const replaceHtmlEntites = (string: string) => {
	return string.replace(HTML_ENTITIES, (_, entity) => HTML_ENTITIES_TO_CHAR[entity]);
};

/**
 * Derive a pub from the HTML of a webpage.
 */
export const makePubFromUrl = async (url: string) => {
	const metadata = await extract(url);
	if (typeof metadata.DOI === "string") {
		metadata.DOI = normalizeDoi(metadata.DOI);
		// If a DOI was found in the HTML, try to fetch metadata from doi.org.
		Object.assign(metadata, await makePubFromDoi(metadata.DOI));
	}
	if (typeof metadata.Description === "string") {
		metadata.Description = replaceHtmlEntites(metadata.Description);
	}
	return metadata;
};
