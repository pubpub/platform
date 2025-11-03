import { InputWithTokens, MarkdownEditor } from "ui/editors";
import { FieldSet } from "ui/field";

import { ActionField } from "../_lib/ActionField";
import { useActionForm } from "../_lib/ActionForm";
import MemberSelectClientFetch from "./DynamicSelectFetch";

export default function EmailActionForm() {
	const { form } = useActionForm();
	const [recipientMember, recipientEmail] = form.watch(["recipientMember", "recipientEmail"]);
	return (
		<FieldSet>
			<ActionField name="senderName" label="Sender Name" />
			<ActionField name="replyTo" label="Reply-To" />
			{!recipientMember && <ActionField name="recipientEmail" label="Recipient Email" />}
			{!recipientEmail && (
				<ActionField
					name="recipientMember"
					label="Recipient Member"
					render={({ field, fieldState }) => (
						<MemberSelectClientFetch
							name={field.name}
							aria-invalid={fieldState.invalid}
							onChange={field.onChange}
							value={field.value}
						/>
					)}
				/>
			)}
			<ActionField
				name="subject"
				label="Subject"
				labelId="subject-label"
				render={({ field, fieldState }) => (
					<InputWithTokens
						{...field}
						aria-invalid={fieldState.invalid}
						aria-labelledby="subject-label"
					/>
				)}
			/>
			<ActionField
				name="body"
				label="Body"
				labelId="body-label"
				render={({ field, fieldState }) => (
					<MarkdownEditor
						{...field}
						aria-invalid={fieldState.invalid}
						aria-labelledby="body-label"
					/>
				)}
			/>
		</FieldSet>
	);
}
