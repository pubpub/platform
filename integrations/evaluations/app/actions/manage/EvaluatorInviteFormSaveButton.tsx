import { useFormState } from "react-hook-form";
import { Button, Icon } from "ui";

export type EvaluatorInviteFormSaveButtonProps = {
	onClick: () => void;
};

export function EvaluatorInviteFormSaveButton(props: EvaluatorInviteFormSaveButtonProps) {
	const formState = useFormState();
	return (
		<Button onClick={props.onClick} disabled={formState.isSubmitting}>
			Save
		</Button>
	);
}
