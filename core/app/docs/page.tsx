import DocumentationUI from "./DocumentationUI";
import { openApiDocument } from "lib/swagger/swaggerSpec";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
	return (
		<section className="container">
			<DocumentationUI spec={openApiDocument} />
		</section>
	);
}
