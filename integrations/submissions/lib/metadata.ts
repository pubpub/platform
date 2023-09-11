import { SAXParser } from "parse5-sax-parser";
import { get } from "node:https";
import { isDoi, expect } from "utils";
import { normalizeDoi } from "../../../packages/utils/dist";

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
	const parser = new SAXParser();
	const metadata = {};
	parser.on("startTag", (tag) => {
		if (tag.tagName === "link") {
			let href: string | undefined;
			for (let i = 0; i < tag.attrs.length; i++) {
				const attr = tag.attrs[i];
				if (attr.name === "rel") {
					if (attr.value !== "canonical") {
						return;
					}
				} else if (attr.name === "href") {
					href = attr.value;
				}
			}
			if (!href) {
				return;
			}
			metadata["URL"] = href;
		} else if (tag.tagName === "meta") {
			let name: string | undefined;
			let content: string | undefined;
			for (let i = 0; i < tag.attrs.length; i++) {
				const attr = tag.attrs[i];
				if (attr.name === "name") {
					name = attr.value;
				} else if (attr.name === "content") {
					content = attr.value;
				}
			}
			if (!name || !content) {
				return;
			}
			switch (name.toLowerCase()) {
				case "dc.identifier":
				case "citation_doi":
				case "prism.doi":
					metadata["DOI"] ??= normalizeDoi(content);
					break;
				case "og:description":
				case "citation_abstract":
					metadata["Description"] ??= content;
					break;
				case "og:title":
				case "citation_title":
					metadata["Title"] ??= content;
					break;
				case "citation_public_url":
					metadata["URL"] ??= content;
					break;
				default:
					return;
			}
		} else if (tag.tagName === "body") {
			// We've reached the body tag, so we can stop parsing page metadata.
			parser.stop();
		}
	});
	return new Promise((resolve, reject) => {
		get(url, (res) => {
			// Follow redirects.
			if (res.statusCode === 302) {
				return resolve(makePubFromUrl(expect(res.headers.location)));
			}
			res.on("data", (chunk) => {
				parser.write(chunk.toString());
			});
			res.on("end", () => {
				parser.end();
				resolve(metadata);
			});
			res.on("error", (error) => {
				reject(error);
			});
		});
	});
};
