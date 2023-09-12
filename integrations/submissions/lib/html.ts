import * as https from "https";
import * as http from "http";
import { SAXParser, StartTag, Text } from "parse5-sax-parser";
import { expect } from "utils";

const $indiscriminate = Symbol("indiscriminate");

/**
 * A mapping from a tag in an HTML document to a metadata field. The `rank`
 * property is used to determine which mapping should take priority when
 * multiple mappings match the same metadata field.
 */
export type TagMapping<T extends string = string> = {
	/**
	 * The metadata field to which the extracted value should be mapped.
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
	tagTypeAttr?: string | typeof $indiscriminate;
	/**
	 * The value of the `tagTypeAttr` attribute that must be matched for the tag
	 * to be matched.
	 */
	tagTypeAttrValue?: string;
	/**
	 * The name of the attribute from which to extract the value. If this
	 * property is not supplied, the value will be extracted from the element's
	 * text content.
	 */
	tagValueAttr?: string;
};

export type TagMappings = TagMapping[];

/**
 * Tag mappings grouped by tag name, then by the desired type attribute, then
 * sorted by rank. Used to speed up extraction.
 */
export type NormalizedTagMappings = {
	[tagName: string]: {
		[tagTypeAttr: string]: TagMapping[];
	} & {
		[$indiscriminate]: TagMapping[];
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
export type ExtractRanks = {
	[key: string]: number;
};

const normalizeMappings = (tagMappings: TagMappings): NormalizedTagMappings => {
	const normalizedTagMappings = {} as NormalizedTagMappings;
	for (let i = 0; i < tagMappings.length; i++) {
		const tagMapping = tagMappings[i];
		if (tagMapping.tagTypeAttrValue !== undefined) {
			tagMapping.tagTypeAttrValue = tagMapping.tagTypeAttrValue.toLowerCase();
		}
		if (tagMapping.tagTypeAttr === undefined) {
			tagMapping.tagTypeAttr = $indiscriminate;
		}
		const normalizedTags = (normalizedTagMappings[tagMapping.tagName] ??= {
			[$indiscriminate]: [],
		});
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

const makeExtractRanks = (tagMappings: TagMappings): ExtractRanks => {
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
	const extractPageMetadata = (url: string, depth = 0): Promise<ExtractResult<T>> => {
		return new Promise((resolve, reject) => {
			// Use a SAX parser to extract metadata from an HTML document without
			// having to load the entire document into memory. This parser yields
			// one opening tag at a time, each of which contains parsed attributes
			// that can be used to extract metadata.
			const parser = new SAXParser();
			const extractRanks = makeExtractRanks(tagMappings);
			const extractResult = {} as ExtractResult<T>;
			const extract = ({ mapTo, rank }: TagMapping, value: string) => {
				extractRanks[mapTo] = rank;
				extractResult[mapTo] = value;
			};
			const isEligibleMapping = (mapping: TagMapping) =>
				extractRanks[mapping.mapTo] <= mapping.rank;
			const mappingsAwaitingTextNode: TagMapping[] = [];
			const handleMappingDiscriminant = (mapping: TagMapping, startTag: StartTag) => {
				// If this mapping has a lower rank than the highest rank that has
				// already been extracted for this field, skip it.
				if (!isEligibleMapping(mapping)) return;
				let match = mapping.tagTypeAttr === undefined;
				let value: string | undefined;
				for (let k = 0; k < startTag.attrs.length; k++) {
					const attr = startTag.attrs[k];
					switch (attr.name) {
						// If we encounter the mapping's tag type attribute, check that
						// its value matches the mapping's tag type attribute value. If
						// it does, we've found a match.
						case mapping.tagTypeAttr:
							if (attr.value.toLowerCase() === mapping.tagTypeAttrValue) match = true;
							break;
						case mapping.tagValueAttr:
							value = attr.value;
							break;
					}
				}
				if (!match) return;
				// Mapping has no value attribute so its value will be extracted from
				// the next text node.
				if (mapping.tagValueAttr === undefined) {
					mappingsAwaitingTextNode.push(mapping);
					return;
				}
				// We hit a match, so update the rank of the extracted field and store
				// the extracted value.
				if (value) {
					extract(mapping, value);
				}
				// If no value was found, we've likely encountered some malformed HTML.
			};
			const handleMappingIndiscriminate = (mapping: TagMapping, startTag: StartTag) => {
				// If this mapping has a lower rank than the highest rank that has
				// already been extracted for this field, skip it.
				if (!isEligibleMapping(mapping)) return;
				if (mapping.tagValueAttr === undefined) {
					// Mapping has no value attribute so its value will be extracted from
					// the next text node.
					mappingsAwaitingTextNode.push(mapping);
				} else {
					// Mapping specifies a value attribute so find the attribute and
					// extract its value.
					for (let j = 0; j < startTag.attrs.length; j++) {
						const attr = startTag.attrs[j];
						if (attr.name === mapping.tagValueAttr) {
							extract(mapping, attr.value);
							return;
						}
					}
				}
			};
			const onStartTag = (startTag: StartTag) => {
				// Currently `extractPageMetadata` only supports extracting metadata
				// from tags with simple signatures (e.g. meta tags). So we stop
				// parsing once we hit the body tag to save some CPU time.
				if (startTag.tagName === "body") {
					parser.end();
					return;
				}
				const tagMappings = normalizedTagMappings[startTag.tagName];
				// If there are no tag mappings for this tag, skip it.
				if (!tagMappings) return;
				// Handle the indiscriminate mappings, i.e. mappings that don't specify
				// a type attribute/value.
				const mappings = tagMappings[$indiscriminate];
				for (let i = 0; i < mappings.length; i++) {
					const mapping = mappings[i];
					handleMappingIndiscriminate(mapping, startTag);
				}
				// Handle the discriminant mappings, i.e. mappings that specify a type
				// attribute.
				for (let i = 0; i < startTag.attrs.length; i++) {
					const attr = startTag.attrs[i];
					const attrMappings = tagMappings[attr.name];
					// If there are no tag mappings that specify this attribute, skip it.
					if (!attrMappings) continue;
					for (let j = 0; j < attrMappings.length; j++) {
						const mapping = attrMappings[j];
						handleMappingDiscriminant(mapping, startTag);
					}
				}
			};
			const onText = (node: Text) => {
				// Handle mappings that matched and are waiting for the next text node
				// to extract a value from.
				let mapping: TagMapping | undefined;
				while ((mapping = mappingsAwaitingTextNode.shift())) {
					if (isEligibleMapping(mapping)) {
						extract(mapping, node.text);
					}
				}
			};
			parser.on("startTag", onStartTag);
			parser.on("text", onText);
			const get = isHttpsUrl(url) ? https.get : http.get;
			get(url, (res) => {
				// Follow redirects.
				if (res.statusCode === 301 || res.statusCode === 302) {
					if (depth > 2) {
						parser.end();
						return reject(new Error("Too many redirects"));
					}
					return resolve(extractPageMetadata(expect(res.headers.location), depth + 1));
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
	return extractPageMetadata;
};
