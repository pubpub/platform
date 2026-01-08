import { Checkbox } from "ui/checkbox"
import { DatePicker } from "ui/date-picker"
import { FieldSet } from "ui/field"

import { ActionField } from "../_lib/ActionField"

export default function LogActionForm() {
	return (
		<FieldSet>
			<ActionField name="doi" label="DOI" />
			<ActionField name="doiPrefix" label="DOI Prefix" />
			<ActionField name="doiSuffix" label="DOI Suffix" />
			<ActionField name="title" label="Title" />
			<ActionField name="url" label="URL" />
			<ActionField name="publisher" label="Publisher" />
			<ActionField
				name="publicationDate"
				label="Publication Date"
				render={({ field }) => (
					<DatePicker
						disabled={field.disabled}
						date={field.value}
						setDate={field.onChange}
					/>
				)}
			/>
			<ActionField name="contributor" label="Contributor" />
			<ActionField name="contributorPerson" label="Contributor Person" />
			<ActionField name="contributorPersonName" label="Contributor Person Name" />
			<ActionField name="contributorPersonORCID" label="Contributor Person ORCID" />
			<ActionField
				name="bylineContributorFlag"
				label="Byline Contributor Flag"
				render={({ field, fieldState }) => (
					<Checkbox
						className="!w-4 shrink"
						aria-invalid={fieldState.invalid}
						checked={field.value}
						onCheckedChange={field.onChange}
					/>
				)}
			/>
		</FieldSet>
	)
}
