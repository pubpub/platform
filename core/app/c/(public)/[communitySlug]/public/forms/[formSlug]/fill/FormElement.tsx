import { ReactNode } from "react";

import { CoreSchemaType } from "db/public";

import type { Form } from "~/lib/server/form";

const ElementFromSchema = ({ schema }: { schema: CoreSchemaType }) => {
	if (schema === CoreSchemaType.String) {
		return <input></input>;
	}
	if (schema === CoreSchemaType.Boolean) {
		return <input type="checkbox"></input>;
	}
	return "todo";
};

export const FormElement = ({ element }: { element: Form["elements"][number] }) => {
	console.log({ element });
	return (
		<div>
			<div>{element.label}</div>
			<ElementFromSchema schema={element.schemaName} />
		</div>
	);
};
