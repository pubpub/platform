import { get } from "https";
import { SAXParser, StartTag } from "parse5-sax-parser";
import { expect } from "utils";

export type TagMapping<T extends string = string> = {
	mapTo: T;
	rank: number;
	tagName: string;
	tagTypeAttr: string;
	tagTypeAttrValue: string;
	tagValueAttr: string;
};

export type TagMappings = TagMapping[];

export type NormalizedTagMappings = {
	[tagName: string]: {
		[tagTypeAttr: string]: TagMapping[];
	};
};

export type ExtractResult<T extends TagMappings> = {
	[K in T[number]["mapTo"]]: string;
};

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

export const makeExtract = <T extends TagMappings>(...tagMappings: T) => {
	const normalizedTagMappings = normalizeMappings(tagMappings);
	const extract = async (url: string): Promise<ExtractResult<T>> => {
		return new Promise((resolve, reject) => {
			const parser = new SAXParser();
			const extractState = makeExtractState(tagMappings);
			const extractResult = {} as ExtractResult<T>;
			const onStartTag = (tag: StartTag) => {
				const tagMappings = normalizedTagMappings[tag.tagName];
				if (!tagMappings) {
					return;
				}
				for (let i = 0; i < tag.attrs.length; i++) {
					const attr = tag.attrs[i];
					const attrMappings = tagMappings[attr.name];
					if (!attrMappings) {
						continue;
					}
					for (let j = 0; j < attrMappings.length; j++) {
						const attrMapping = attrMappings[j];
						if (extractState[attrMapping.mapTo] > attrMapping.rank) {
							continue;
						}
						let isMappedTag = false;
						let value: string | undefined;
						for (let k = 0; k < tag.attrs.length; k++) {
							const attr = tag.attrs[k];
							switch (attr.name) {
								case attrMapping.tagTypeAttr:
									if (attr.value.toLowerCase() === attrMapping.tagTypeAttrValue) {
										isMappedTag = true;
									}
									break;
								case attrMapping.tagValueAttr:
									value = attr.value;
									break;
							}
						}
						if (isMappedTag) {
							extractState[attrMapping.mapTo] = attrMapping.rank;
							extractResult[attrMapping.mapTo] = value;
						}
					}
				}
			};
			parser.on("startTag", onStartTag);
			get(url, (res) => {
				// Follow redirects.
				if (res.statusCode === 301 || res.statusCode === 302) {
					return resolve(extract(expect(res.headers.location)));
				}
				res.on("data", (chunk) => {
					console.log(chunk.toString());
					parser.write(chunk.toString());
				});
				res.on("end", () => {
					parser.end();
					resolve(extractResult);
				});
				res.on("error", (error) => {
					reject(error);
				});
			});
		});
	};
	return extract;
};
