import { openApiDocument } from "lib/swagger/swaggerSpec";

import DocumentationUI from "./DocumentationUI";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
	return (
		<section className="container">
			<DocumentationUI spec={openApiDocument} />
		</section>
	);
}
