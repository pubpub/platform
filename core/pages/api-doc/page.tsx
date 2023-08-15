import ReactSwagger from "./SwaggerUi";
import { openApiDocument } from "../../lib/swagger/swaggerSpec";

export default async function IndexPage() {
	return (
		<section className="container">
			<ReactSwagger spec={openApiDocument} />
		</section>
	);
}
