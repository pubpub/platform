import { useFormState, useWatch } from "react-hook-form"

import { Button } from "ui/button"
import { Send } from "ui/icon"

import { InviteFormSchema } from "./types"

export type EvaluatorInviteFormInviteButtonProps = {
	onClick: () => void
}

export function EvaluatorInviteFormInviteButton(props: EvaluatorInviteFormInviteButtonProps) {
	const form = useWatch<InviteFormSchema>()
	const formState = useFormState()
	return (
		<Button
			onClick={props.onClick}
			disabled={
				!form.evaluators?.some((evaluator) => evaluator.selected) || formState.isSubmitting
			}
		>
			<Send className="mr-2 h-4 w-4" />
			Invite
		</Button>
	)
}
