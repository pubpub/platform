import type { ProcessedPub } from "contracts";

export const createPubProxy = (pub: ProcessedPub, communitySlug: string): any => {
	const valuesMap = new Map<string, ProcessedPub["values"][number]>();

	// these are just so that if you do `$.values`/`$.out`/`$.fields` you can see what fields are available
	const fields: Record<string, undefined> = {};
	const relations: Record<string, undefined> = {};

	for (const value of pub.values) {
		fields[value.fieldSlug] = undefined;
		fields[value.fieldSlug.replace(`${communitySlug}:`, "")] = undefined;
		if (value.relatedPub) {
			relations[value.fieldSlug] = undefined;
			relations[value.fieldSlug.replace(`${communitySlug}:`, "")] = undefined;
		}
		valuesMap.set(value.fieldSlug, value);
	}

	const pubWithAdditionalFields = { ...pub, fields: undefined, out: undefined };

	return new Proxy(pubWithAdditionalFields, {
		get(target, prop) {
			if (prop === "fields") {
				return new Proxy(fields, {
					get(_, fieldSlug: string) {
						return fields[fieldSlug];
					},
				});
			}
			if (prop === "values") {
				return new Proxy(fields, {
					get(_, fieldSlug: string) {
						const val =
							valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
							valuesMap.get(fieldSlug);
						return val?.value;
					},
				});
			}

			if (prop === "out") {
				return new Proxy(relations, {
					get(_, fieldSlug: string) {
						const val =
							valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
							valuesMap.get(fieldSlug);
						if (val && "relatedPub" in val && val.relatedPub) {
							return createPubProxy(val.relatedPub, communitySlug);
						}
						return undefined;
					},
				});
			}

			return target[prop as keyof typeof target];
		},
	});
};
