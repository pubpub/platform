import { remove as removeDiacritics } from "diacritics";

import type { PubsId } from "db/public";
import { logger } from "logger";
import { isUuid } from "utils";

import type { Prettify, XOR } from "./types";

export const genHumanSlug = (title: string, slug: string): string => {
	const titleSlug = slugifyString(title).slice(0, 25);
	return `${titleSlug}-${slug}`;
};

export const slugifyString = (input: string) => {
	if (typeof input !== "string") {
		logger.error("input is not a valid string");
		return "";
	}
	return removeDiacritics(input)
		.replace(/[^a-zA-Z0-9-\s]/gi, "")
		.trim()
		.replace(/ /g, "-")
		.toLowerCase();
};

export const createRandomSlug = () => {
	return generateHash(10);
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const toTitleCase = (str: string) =>
	str.replace(
		/\w\S*/g,
		(txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	);

const strConcat = (...strings: string[]) => strings.reduce((acc, str) => acc + str, "");

export const joinOxford = (
	items: string[],
	{ joiner = strConcat, empty = "", ampersand = false } = {}
) => {
	const twoAnd = ampersand ? " & " : " and ";
	const manyAnd = ampersand ? " & " : ", and ";
	if (items.length === 0) {
		return empty;
	}
	return items.reduce((acc: string, item: string, index: number) =>
		joiner(acc, items.length === 2 ? twoAnd : index === items.length - 1 ? manyAnd : ", ", item)
	);
};

export const btoaUniversal = (input: string) => {
	try {
		return btoa(input);
	} catch (err) {
		return Buffer.from(input).toString("base64");
	}
};

export const generateHash = (length: number, customCharacters?: string) => {
	const letters = "abcdefghjkmnpqrstuvwxyz";
	const numbers = "23456789";
	const characters = customCharacters || letters + numbers;
	let result = "";
	for (let i = 0; i < length; i++) {
		/* Ensure first character in output is a letter, not a number */
		const lengthToUse = i === 0 && !customCharacters ? letters.length : characters.length;
		result += characters.charAt(Math.floor(Math.random() * lengthToUse));
	}
	return result;
};

export const getSlugSuffix = (slug: string) => {
	return slug.split("-").pop() || "";
};

type IdLike = `${string}Id`;

/**
 * From a union of a string and a brand, extract the branded type if it's present,
 * otherwise return the string.
 */
type BrandedOrString<T extends string> = Extract<T, { __brand: string }>;

type BrandedOrStringResult<
	T extends string,
	Key extends IdLike | undefined = undefined,
> = Key extends IdLike
	?
			| Prettify<{ [k in Key]?: never | undefined } & { slug: string; id?: never }>
			| Prettify<{ [k in Key]: BrandedOrString<T> } & { slug?: never; id?: never }>
	: { slug: string; id: BrandedOrString<T> };

export const idOrSlug = <T extends string = string, Key extends IdLike | undefined = undefined>(
	idOrSlug: T,
	key?: Key
): BrandedOrStringResult<T, Key> => {
	if (isUuid(idOrSlug)) {
		return { [key ?? "id"]: idOrSlug as T } as BrandedOrStringResult<T, Key>;
	}
	return { slug: idOrSlug } as BrandedOrStringResult<T, Key>;
};
