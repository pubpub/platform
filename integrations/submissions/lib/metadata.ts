import { isDoi, normalizeDoi } from "utils";

import { makeExtractPageMetadata } from "./html";

/**
 * Derive a pub from CSL-JSON.
 */
const derivePubFromCsl = (csl: any) => {
	return {
		"legacy-unjournal:description": csl.abstract,
		"legacy-unjournal:doi": csl.DOI,
		"legacy-unjournal:title": csl.title,
		"legacy-unjournal:url": csl.resource?.primary?.URL ?? csl.URL,
	};
};

/**
 * Derive a pub from a work returned by the Crossref API.
 */
const derivePubFromCrossrefWork = (work: any) => {
	return {
		"legacy-unjournal:description": work.abstract,
		"legacy-unjournal:doi": work.DOI,
		"legacy-unjournal:title": Array.isArray(work.title) ? work.title[0] : work.title,
		"legacy-unjournal:url": work.resource?.primary?.URL ?? work.URL,
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
			// Use DOI Content Negotiation to get CSL-JSON.
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
const extractPageMetadata = makeExtractPageMetadata(
	{
		mapTo: "legacy-unjournal:title",
		rank: 0,
		tagName: "title",
	},
	{
		mapTo: "legacy-unjournal:title",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "og:title",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:title",
		rank: 2,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "dc.title",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:description",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "og:description",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:description",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "description",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:doi",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "citation_doi",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:doi",
		rank: 1,
		tagName: "meta",
		tagTypeAttr: "name",
		tagTypeAttrValue: "dc.identifier",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:url",
		rank: 0,
		tagName: "meta",
		tagTypeAttr: "property",
		tagTypeAttrValue: "og:url",
		tagValueAttr: "content",
	},
	{
		mapTo: "legacy-unjournal:url",
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
	// If the URL contains a DOI, try to fetch metadata from doi.org.
	if (isDoi(url)) {
		const pub = await makePubFromDoi(normalizeDoi(url));
		if (pub !== null) {
			return pub;
		}
	}
	// Extract metadata directly from the page's HTML.
	const pub = await extractPageMetadata(url);
	if (typeof pub["legacy-unjournal:url"] === "undefined") {
		pub["legacy-unjournal:url"] = url;
	}
	if (typeof pub["legacy-unjournal:doi"] === "string") {
		pub["legacy-unjournal:doi"] = normalizeDoi(pub["legacy-unjournal:doi"]);
		// If a DOI was found in the HTML, try to fetch pub from doi.org.
		Object.assign(pub, await makePubFromDoi(pub["legacy-unjournal:doi"]));
	}
	if (typeof pub["legacy-unjournal:description"] === "string") {
		pub["legacy-unjournal:description"] = replaceHtmlEntites(
			pub["legacy-unjournal:description"]
		);
	}
	return pub;
};
