import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
	const spec = createSwaggerSpec({
		apiFolder: "app/api", // define api folder under app folder
		definition: {
			openapi: "3.0.0",
			info: {
				title: "Pub Pub Fisch KF formerly known as KFG not to be Confused with KFC",
				version: "7.0",
			},
			components: {
                // im not sure what lines 13 - 18
				securitySchemes: {
					BearerAuth: {
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
