import ReactSwagger from "./SwaggerUi";
import { api } from "../../contract";
import { generateOpenApi } from "@ts-rest/open-api";

const openApiDocument = generateOpenApi(api, {
	info: {
		title: "Integrations API",
		version: "0.0.1",
	},
});

export default async function IndexPage() {
	return (
		<section className="container">
			<ReactSwagger spec={openApiDocument} />
		</section>
	);
}
