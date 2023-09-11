import { isDoi } from "utils";
import { normalizeDoi } from "../../../packages/utils/dist";
import { makeExtract } from "./html";

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
		return extractFieldsFromCrossrefWork(work);
	}
	return null;
};

const extractFieldsFromCrossrefWork = (work: any) => {
	return {
		Description: work.abstract,
		DOI: work.DOI,
		Title: Array.isArray(work.title) ? work.title[0] : work.title,
		URL: work.URL,
	};
};

export const makePubFromCrossrefDoi = async (doi: string) => {
	const response = await fetch(`https://api.crossref.org/works/${doi}`);
	if (!response.ok) {
		return null;
	}
	const { message: work } = await response.json();
	return extractFieldsFromCrossrefWork(work);
};

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
const HTML_ENTITIES_MAP = {
	nbsp: " ",
	amp: "&",
	quot: '"',
	lt: "<",
	gt: ">",
};

const replaceHtmlEntites = (string: string) => {
	return string.replace(HTML_ENTITIES, (_, entity) => HTML_ENTITIES_MAP[entity]);
};

export const makePubFromUrl = async (url: string) => {
	// If the URL contains a DOI, try to fetch metadata from crossref.
	if (isDoi(url)) {
		const pub = await makePubFromCrossrefDoi(normalizeDoi(url));
		// Crossref returned metadata for this DOI.
		if (pub !== null) {
			return pub;
		}
		// Crossref doesn't have metadata for this DOI, so try to scrape metadata
		// from the URL.
	}
	// We use a SAX parser to avoid loading the entire HTML document into memory.
	const metadata = await extract(url);
	if ("DOI" in metadata) {
		metadata.DOI = normalizeDoi(metadata.DOI);
	}
	if ("Description" in metadata) {
		metadata.Description = replaceHtmlEntites(metadata.Description);
	}
	return metadata;
};
