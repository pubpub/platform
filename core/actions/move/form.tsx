import { FieldSet } from "ui/field";
import { StagesSelect } from "ui/stages";

import { ActionField } from "../_lib/ActionField";

export default function MoveActionForm() {
	return (
		<FieldSet>
			<ActionField
				name="stage"
				label="Stage"
				render={({ field }) => <StagesSelect field={field} />}
			/>
		</FieldSet>
	);
}
