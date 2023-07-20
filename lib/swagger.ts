import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
	const spec = createSwaggerSpec({
		apiFolder: "app/api", // define api folder under app folder
		definition: {
			openapi: "3.1.0",
			info: {
				title: "Pub Pub Integrations API",
				summary: "Endpoints for V7 integrations",
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
					url: "https://pubpub/v7/dev:3000",
					description: "The development API server",
				},
				{
					url: "https://pubpub/v7/staging:3000",
					description: "The staging API server",
				},
				{
					url: "https://pubpub/v7:3000",
					description: "The production API server",
				},
			],
			components: {
				schemas: {
					PubFields: {
						type: "object",
					},
				},
			},
			security: [],
		},
	});
	return spec;
};
