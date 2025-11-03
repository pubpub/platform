import { FieldSet } from "ui/field";
import { Input } from "ui/input";

import { ActionField } from "../_lib/ActionField";

export default function DataciteActionForm() {
	return (
		<FieldSet>
			<ActionField
				name="docUrl"
				label="Document URL"
				render={({ field, fieldState }) => (
					<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="outputField"
				label="Output Field"
				render={({ field, fieldState }) => (
					<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
		</FieldSet>
	);
}
