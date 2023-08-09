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
					url: "https://localhost:3000",
					description: "The development API server",
				},
				{
					url: "https://pubpub/staging:3000",
					description: "The staging API server",
				},
				{
					url: "https://pubpub:3000",
					description: "The production API server",
				},
			],
			components: {
				schemas: {
					User: {
						type: "object",
						properties: {
							id: {
								type: "string",
							},
							name: {
								type: "string",
							},
							email: {
								type: "string",
							},
						},
					},
					Users: {
						type: "array",
						items: {
							$ref: "#/components/schemas/User",
						},
					},
					PubFields: {
						type: "object",
					},
					PubNotFound: {
						type: "string",
					},
					ApiKey: {
						type: "string",
					},
					AccessToken: {
						type: "string",
					},
					InvalidInstanceId: {
						type: "string",
					},
					InstanceNotFound: {
						type: "string",
					},
					InvalidApiKey: {
						type: "string",
					},
					InvalidAccessToken: {
						type: "string",
					},
				},
				parameters: {
					instanceId: {
						name: "instanceId",
						in: "path",
						description: "used to query an instance for the integration",
						required: true,
						schema: {
							type: "string",
						},
					},
					apikey: {
						name: "apikey",
						in: "header",
						description: "An API key issued for the integration",
						required: true,
						schema: {
							type: "string",
						},
					},
					pubId: {
						name: "pubId",
						in: "path",
						description: "used to query a pub",
						required: true,
						schema: {
							type: "string",
						},
					},
					input: {
						name: "input",
						in: "query",
						description:
							"takes a partial name or full email to query for a user. if email doesnt exist a minimal user will be created",
						required: true,
						schema: {
							type: "string",
						},
						example: "Mugi",
						examples: {
							"suggest-user-by-name": {
								value: "Mugi",
								summary: "A partial name",
							},
							"suggest-user-by-email": {
								value: "goingmerry@gone.pir",
								summary: "A full email",
							},
						},
					},
				},
				securitySchemes: {
					ApiKeyAuth: {
						type: "apiKey",
						in: "header",
						name: "x-pubpub-api-key",
					},
					AccessTokenAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
			security: [],
		},
	});
	return spec;
};
