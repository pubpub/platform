import { useMemo } from "react"

import { FieldSet } from "ui/field"
import { createFilterSchema, MonacoFormField } from "ui/monaco"
import { usePubFieldContext } from "ui/pubFields"

import { ActionField } from "../_lib/ActionField"
import { useActionForm } from "../_lib/ActionForm"

export default function BuildJournalSiteActionForm() {
	const { form } = useActionForm()
	console.log(form.formState.errors)

	const pubFields = usePubFieldContext()
	console.log(pubFields)
	const filterSchema = useMemo(
		() => createFilterSchema(Object.values(pubFields).map((field) => field.slug)),
		[pubFields]
	)

	return (
		<FieldSet>
			<ActionField
				name="filter"
				label="Filter"
				render={({ field }) => (
					<MonacoFormField field={field} language="json" jsonSchema={filterSchema} />
				)}
			/>
			<ActionField
				name="pages"
				label="Pages"
				render={({ field }) => <MonacoFormField field={field} language="jsonata" />}
			/>
		</FieldSet>
	)
}
