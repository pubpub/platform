import { FieldSet } from "ui/field";
import { Input } from "ui/input";

import { ActionField } from "../_lib/ActionField";

export default function LogActionForm() {
	return (
		<FieldSet>
			<ActionField name="text" label="Log Text" />
			<ActionField
				name="debounce"
				label="Debounce (ms)"
				render={({ field, fieldState }) => (
					<Input
						type="number"
						{...field}
						id={field.name}
						aria-invalid={fieldState.invalid}
						onChange={(e) => field.onChange(Number(e.target.value ?? 0))}
					/>
				)}
			/>
		</FieldSet>
	);
}
