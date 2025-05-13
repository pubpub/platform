import type { NonGenericProcessedPub, ProcessedPub } from "contracts";

export const getFieldValue = <T extends unknown = unknown>(
	pub: NonGenericProcessedPub,
	fieldName: string
) => {
	if (!pub) {
		throw new Error("Pub is undefined");
	}
	return pub.values?.find((value) => value.fieldName === fieldName)?.value as T;
};

export const getRelatedPubs = (
	pub: NonGenericProcessedPub | null | undefined,
	fieldName: string
) => {
	if (!pub) {
		throw new Error("Pub is undefined");
	}
	return pub.values
		?.filter((value) => value.fieldName === fieldName)
		.map((value) => value.relatedPub);
};
