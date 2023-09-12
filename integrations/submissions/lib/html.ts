import * as https from "https";
import * as http from "http";
import { SAXParser, StartTag } from "parse5-sax-parser";
import { expect } from "utils";

/**
 * A mapping from a tag in an HTML document to a PubPub metadata field. The
 * `rank` property is used to determine which mapping should take priority when
 * multiple mappings match the same tag.
 */
export type TagMapping<T extends string = string> = {
	/**
	 * The PubPub metadata field to which the extracted value should be mapped.
	 */
	mapTo: T;
	/**
	 * The priority of this mapping relative to other mappings. Lower values take
	 * priority over higher values.
	 */
	rank: number;
	/**
	 * The name of the tag to match.
	 */
	tagName: string;
	/**
	 * The name of an attribute that would help identify the tag as a candidate
	 * for extraction. If a tag being visited has no attribute with this name,
	 * the tag will be skipped. The value of this attribute must match
	 * `tagTypeAttrValue` for the tag to be matched.
	 */
	tagTypeAttr: string;
	/**
	 * The value of the `tagTypeAttr` attribute that must be matched for the tag
	 * to be matched.
	 */
	tagTypeAttrValue: string;
	/**
	 * The name of the attribute from which to extract the value.
	 */
	tagValueAttr: string;
};

export type TagMappings = TagMapping[];

/**
 * Tag mappings grouped by tag name, then by the desired type attribute, then
 * sorted by rank. Used to speed up extraction.
 */
export type NormalizedTagMappings = {
	[tagName: string]: {
		[tagTypeAttr: string]: TagMapping[];
	};
};

/**
 * The result of the metadata extraction.
 */
export type ExtractResult<T extends TagMappings> = {
	[K in T[number]["mapTo"]]: string;
};

/**
 * The state of the extraction process. Stores the highest rank of each metadata
 * field that has been extracted so far. Mappings with a lower rank than the
 * value stored for a given field will not be considered.
 */
export type ExtractState = {
	[key: string]: number;
};

const normalizeMappings = (tagMappings: TagMappings): NormalizedTagMappings => {
	const normalizedTagMappings = {} as NormalizedTagMappings;
	for (let i = 0; i < tagMappings.length; i++) {
		const tagMapping = tagMappings[i];
		tagMapping.tagTypeAttrValue = tagMapping.tagTypeAttrValue.toLowerCase();
		const normalizedTags = (normalizedTagMappings[tagMapping.tagName] ??= {});
		const normalizedTypes = (normalizedTags[tagMapping.tagTypeAttr] ??= []);
		normalizedTypes.push(tagMapping);
	}
	for (const tagName in normalizedTagMappings) {
		for (const tagTypeAttr in normalizedTagMappings[tagName]) {
			normalizedTagMappings[tagName][tagTypeAttr].sort((a, b) => a.rank - b.rank);
		}
	}
	return normalizedTagMappings as NormalizedTagMappings;
};

const makeExtractState = (tagMappings: TagMappings): ExtractState => {
	const extractState = {};
	for (let i = 0; i < tagMappings.length; i++) {
		const tagMapping = tagMappings[i];
		extractState[tagMapping.mapTo] ??= -Infinity;
	}
	return extractState;
};

const isHttpsUrl = (url: string) => {
	return url.startsWith("https://");
};

export const makeExtractPageMetadata = <T extends TagMappings>(...tagMappings: T) => {
	const normalizedTagMappings = normalizeMappings(tagMappings);
	const extract = async (url: string, depth = 0): Promise<ExtractResult<T>> => {
		return new Promise((resolve, reject) => {
			// Use a SAX parser to extract metadata from an HTML document without
			// having to load the entire document into memory. This parser yields
			// one opening tag at a time, each of which contains parsed attributes
			// that can be used to extract metadata.
			const parser = new SAXParser();
			const extractState = makeExtractState(tagMappings);
			const extractResult = {} as ExtractResult<T>;
			const onStartTag = (tag: StartTag) => {
				// Currently `makeExtract` only supports extracting metadata from tags
				// with simple signatures (i.e. meta tags, and tags with no children).
				// So we stop parsing once we hit the body tag to save some CPU time.
				if (tag.tagName === "body") {
					parser.stop();
					return;
				}
				const tagMappings = normalizedTagMappings[tag.tagName];
				// If there are no tag mappings for this tag, skip it.
				if (!tagMappings) {
					return;
				}
				for (let i = 0; i < tag.attrs.length; i++) {
					const attr = tag.attrs[i];
					const attrMappings = tagMappings[attr.name];
					// If there are no tag mappings that specify this attribute, skip it.
					if (!attrMappings) {
						continue;
					}
					for (let j = 0; j < attrMappings.length; j++) {
						const attrMapping = attrMappings[j];
						// If this mapping has a lower rank than the highest rank that has
						// already been extracted for this field, skip it.
						if (extractState[attrMapping.mapTo] > attrMapping.rank) {
							continue;
						}
						let isMappableTag = false;
						let value: string | undefined;
						for (let k = 0; k < tag.attrs.length; k++) {
							const attr = tag.attrs[k];
							switch (attr.name) {
								// If we encounter the mapping's tag type attribute, check that
								// its value matches the mapping's tag type attribute value. If
								// it does, we've found a match.
								case attrMapping.tagTypeAttr:
									if (attr.value.toLowerCase() === attrMapping.tagTypeAttrValue) {
										isMappableTag = true;
									}
									break;
								case attrMapping.tagValueAttr:
									value = attr.value;
									break;
							}
						}
						// If no value was found, we've likely encountered some malformed
						// HTML. Continue to the next mapping.
						if (value && isMappableTag) {
							// We hit a match, so update the rank of the extracted field and
							// store the extracted value.
							extractState[attrMapping.mapTo] = attrMapping.rank;
							extractResult[attrMapping.mapTo] = value;
						}
					}
				}
			};
			parser.on("startTag", onStartTag);
			(isHttpsUrl(url) ? https.get : http.get)(url, (res) => {
				// Follow redirects.
				if (res.statusCode === 301 || res.statusCode === 302) {
					if (depth > 2) {
						parser.end();
						return reject(new Error("Too many redirects"));
					}
					return resolve(extract(expect(res.headers.location), depth + 1));
				}
				res.on("data", (chunk) => {
					parser.write(chunk.toString());
				});
				res.on("end", () => {
					parser.end();
					resolve(extractResult);
				});
				res.on("error", (error) => {
					parser.end();
					reject(error);
				});
			});
		});
	};
	return extract;
};
