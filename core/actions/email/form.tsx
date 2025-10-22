import { InputWithTokens, MarkdownEditor } from "ui/editors";
import { FieldSet } from "ui/field";
import { Input } from "ui/input";

import { ActionField } from "../_lib/ActionField";
import MemberSelectClientFetch from "./DynamicSelectFetch";

export default function EmailActionForm() {
	return (
		<FieldSet>
			<ActionField
				name="senderName"
				label="Sender Name"
				render={({ field, fieldState }) => (
					<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="replyTo"
				label="Reply-To"
				render={({ field, fieldState }) => (
					<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="recipientEmail"
				label="Recipient Email"
				render={({ field, fieldState }) => (
					<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="recipientMember"
				label="Recipient Member"
				render={({ field, fieldState }) => (
					<MemberSelectClientFetch name={field.name} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="subject"
				label="Subject"
				render={({ field, fieldState }) => (
					<InputWithTokens {...field} aria-invalid={fieldState.invalid} />
				)}
			/>
			<ActionField
				name="body"
				label="Body"
				render={({ field, fieldState }) => (
					<MarkdownEditor {...field} aria-invalid={fieldState.invalid} />
				)}
			/>
		</FieldSet>
	);
}
