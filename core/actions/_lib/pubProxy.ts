import type { ProcessedPub } from "contracts";

export const createPubProxy = (pub: ProcessedPub, communitySlug: string): any => {
	const valuesMap = new Map(pub.values.map((v) => [v.fieldSlug, v]));

	return new Proxy(pub, {
		get(target, prop) {
			if (prop === "fields") {
				return new Proxy(
					{},
					{
						get(_, fieldSlug: string) {
							return valuesMap.get(fieldSlug);
						},
					}
				);
			}

			if (prop === "values") {
				return new Proxy(
					{},
					{
						get(_, fieldSlug: string) {
							const val =
								valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
								valuesMap.get(fieldSlug);
							return val?.value;
						},
					}
				);
			}

			if (prop === "out") {
				return new Proxy(
					{},
					{
						get(_, fieldSlug: string) {
							const val =
								valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
								valuesMap.get(fieldSlug);
							if (val && "relatedPub" in val && val.relatedPub) {
								return createPubProxy(val.relatedPub, communitySlug);
							}
							return undefined;
						},
					}
				);
			}

			return target[prop as keyof typeof target];
		},
	});
};
