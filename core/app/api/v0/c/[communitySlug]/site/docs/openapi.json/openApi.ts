import type { AppRoute, AppRouter } from "@ts-rest/core";
import type { OpenAPIObject } from "openapi3-ts/oas30";

import { isAppRoute } from "@ts-rest/core";
import { generateOpenApi } from "@ts-rest/open-api";

import { siteApi } from "contracts";

type TraverseContractResult = "SKIP" | "CONTINUE" | "STOP";

const traverseContract = (
	contract: AppRouter | AppRoute,
	fn: (contract: AppRoute) => void | TraverseContractResult
) => {
	for (const route in contract) {
		if (isAppRoute(contract)) {
			const x = fn(contract);
			if (x === "STOP") {
				break;
			}
			continue;
		}
		traverseContract(contract[route], fn);
	}
};

export const createOpenApiDocument = (communitySlug?: string): OpenAPIObject => {
	if (communitySlug) {
		traverseContract(siteApi, (route) => {
			route.path = route.path.replace(/:communitySlug/g, communitySlug);
		});
	}

	return generateOpenApi(
		siteApi,
		{
			openapi: "3.0.0",
			info: {
				title: "Pub Pub Integrations API",
				summary: "Endpoints for PubPub integrations",
				description:
					"The endpoints here can be used by integrations to query and update pub fields defined by their manifest",
				termsOfService: "https://example.com/terms/",
				contact: {
					name: "PubPub",
					url: "https://help.pubpub.org",
					email: "hello@pubpub.org",
				},
				license: {
					name: "Licence Placeholder",
					url: "https://opensource.org/licenses/",
				},
				version: "0.1",
			},
			servers: [
				{
					url: "http://localhost:3000/",
					description: "The development API server",
				},
				{
					url: "https://pubpub.org/",
					description: "The production API server",
				},
			],
		},
		{
			jsonQuery: true,
		}
	);
};
