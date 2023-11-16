import { useFormState, useWatch } from "react-hook-form";
import { Button, Icon } from "ui";
import { InviteFormSchema } from "./types";

export type EvaluatorInviteFormInviteButtonProps = {
	onClick: () => void;
};

export function EvaluatorInviteFormInviteButton(props: EvaluatorInviteFormInviteButtonProps) {
	const form = useWatch<InviteFormSchema>();
	const formState = useFormState();
	return (
		<Button
			onClick={props.onClick}
			disabled={
				!form.evaluators?.some((evaluator) => evaluator.selected) || formState.isSubmitting
			}
		>
			<Icon.Send className="h-4 w-4 mr-2" />
			Invite
		</Button>
	);
}
