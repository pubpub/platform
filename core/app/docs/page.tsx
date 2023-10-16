import DocumentationUI from "./DocumentationUI";
import { openApiDocument } from "lib/swagger/swaggerSpec";

export default async function IndexPage() {
	return (
		<section className="container">
			<DocumentationUI spec={openApiDocument} />
		</section>
	);
}
