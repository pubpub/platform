import { FieldSet } from "ui/field";

import { ActionField } from "../_lib/ActionField";

export default function BuildJournalSiteActionForm() {
	return (
		<FieldSet>
			<ActionField name="siteUrl" label="Site URL" />
		</FieldSet>
	);
}
