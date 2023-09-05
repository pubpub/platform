import { api } from "~/lib/contracts";
import { generateOpenApi } from "@ts-rest/open-api";
import { OpenAPIObject } from "openapi3-ts/oas30";

export const openApiDocument: OpenAPIObject = generateOpenApi(api, {
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
			url: "https://localhost:3000/api/v0",
			description: "The development API server",
		},
		{
			url: "https://pubpub.com/staging/api/v0",
			description: "The staging API server",
		},
		{
			url: "https://pubpub.com/api/v0",
			description: "The production API server",
		},
	],
});
