import { FieldSet } from "ui/field"

import { ActionField } from "../_lib/ActionField"

export default function DataciteActionForm() {
	return (
		<FieldSet>
			<ActionField name="folderUrl" label="Folder URL" />
		</FieldSet>
	)
}
