import ReactSwagger from "./SwaggerUi";
import { api } from "../../contract";
import { generateOpenApi } from "@ts-rest/open-api";

const openApiDocument = generateOpenApi(api, {
	openapi: "3.1.0",
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
			url: "https://localhost:3000/api",
			description: "The development API server",
		},
		{
			url: "https://pubpub.com/staging/api",
			description: "The staging API server",
		},
		{
			url: "https://pubpub.com/api",
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
});

export default async function IndexPage() {
	return (
		<section className="container">
			<ReactSwagger spec={openApiDocument} />
		</section>
	);
}
