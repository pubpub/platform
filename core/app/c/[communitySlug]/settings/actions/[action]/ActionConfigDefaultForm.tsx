"use client"

import type { Action, CommunitiesId } from "db/public"
import type { z } from "zod"

import { useCallback, useMemo } from "react"

import { toast } from "ui/use-toast"

import { ActionForm } from "~/actions/_lib/ActionForm"
import { getActionByName } from "~/actions/api"
import { getActionFormComponent } from "~/actions/forms"
import { didSucceed } from "~/lib/serverActions"
import { updateActionConfigDefault } from "./actions"

type Props = {
	action: Action
	communityId: CommunitiesId
	values?: Record<string, unknown>
}

export const ActionConfigDefaultForm = (props: Props) => {
	const action = useMemo(() => getActionByName(props.action), [props.action])

	const defaultFields = Object.keys((props.values as Record<string, unknown> | undefined) ?? {})

	const schema = useMemo(() => action.config.schema.partial(), [action.config.schema])
	const onSubmit = useCallback(
		async (values: z.infer<typeof schema>) => {
			const result = await updateActionConfigDefault(props.action, values)
			if (didSucceed(result)) {
				toast({
					title: "Success",
					description: "Action config defaults updated",
				})
			}
		},
		[props.action]
	)

	const ActionFormComponent = getActionFormComponent(action.name)

	return (
		<ActionForm
			action={action}
			values={props.values ?? {}}
			defaultFields={defaultFields}
			onSubmit={onSubmit}
			submitButton={{
				text: "Submit",
				pendingText: "Submitting...",
				successText: "Submitted",
				errorText: "Failed to submit",
			}}
			context={{ type: "default" }}
		>
			<ActionFormComponent />
		</ActionForm>
	)
}
