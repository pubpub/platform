import { initClient } from "@ts-rest/core";

import type { CommunitySpecificTypes, NonGenericProcessedPub } from "contracts";
import { createSiteApi } from "contracts";

export const makeClient = <T extends CommunitySpecificTypes = {}>(baseUrl: string) => {
	const api = createSiteApi<T>();
	// do some other modifications, such as replacing the communitySlug with the actual community slug
	// so you don't constantly have to pass it in

	return initClient(api, {
		baseUrl: baseUrl,
	});
};

export const isPubOfType = <
	T extends {
		pubType: {
			name: string;
		};
		values: any[];
	},
	PubTypeName extends T["pubType"]["name"],
>(
	pub: T,
	pubType: PubTypeName
): pub is Extract<T, { pubType: { name: PubTypeName } }> => {
	return pub.pubType.name === pubType;
};
