import { expect } from "./assert";

export const DOI_REGEX = /10.\d{4,9}\/[-._;()/:A-Z0-9]+(?:\?|$)/gi;

export const isDoi = (string: string) => {
	return DOI_REGEX.test(string);
};

export const normalizeDoi = (doi: string) => {
	return expect(doi.match(DOI_REGEX))[0];
};
