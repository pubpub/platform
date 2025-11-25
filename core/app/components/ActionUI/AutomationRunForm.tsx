"use client"

import type { CommunitiesId, PubsId } from "db/public"
import type { FullAutomation, IconConfig } from "db/types"
import type { UseFormReturn } from "react-hook-form"

import { Suspense, useCallback, useState } from "react"

import { logger } from "logger"
import { Button } from "ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog"
import { DynamicIcon } from "ui/dynamic-icon"
import { Separator } from "ui/separator"
import { TokenProvider } from "ui/tokens"
import { toast } from "ui/use-toast"

import { ActionForm } from "~/actions/_lib/ActionForm"
import { getActionByName } from "~/actions/api"
import { runAutomationManual } from "~/actions/api/serverAction"
import { getActionFormComponent } from "~/actions/forms"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { useCommunity } from "../providers/CommunityProvider"
import { SkeletonCard } from "../skeletons/SkeletonCard"

type Props = {
	automation: FullAutomation
	pubId: PubsId
	canOverrideAutomationConditions: boolean
}

export const AutomationRunForm = (props: Props) => {
	const mainActionInstance = props.automation.actionInstances[0]
	const action = getActionByName(mainActionInstance.action)
	const ActionFormComponent = getActionFormComponent(action.name)
	const community = useCommunity()
	const runAutomation = useServerAction(runAutomationManual)

	const onSubmit = useCallback(
		async (values: Record<string, unknown>, form: UseFormReturn<any>) => {
			const result = await runAutomation({
				automationId: props.automation.id,
				pubId: props.pubId,
				manualActionInstancesOverrideArgs: {
					[mainActionInstance.id]: values,
				},
				communityId: community.id as CommunitiesId,
				stack: [],
			})

			if (didSucceed(result)) {
				toast({
					title:
						"title" in result && typeof result.title === "string"
							? result.title
							: `Successfully ran ${props.automation.name || action.name}`,
					variant: "default",
					description: (
						<div className="max-h-40 max-w-sm overflow-auto">{result.report}</div>
					),
				})
				return
			}
			if ("issues" in result && result.issues) {
				const issues = result.issues
				for (const issue of issues) {
					form.setError(issue.path.join("."), {
						message: issue.message,
					})
				}
			}

			form.setError("root.serverError", {
				message: result.error,
			})
		},
		[
			runAutomation,
			props.automation.id,
			props.automation.name,
			props.pubId,
			mainActionInstance.id,
			community.id,
			action.name,
		]
	)

	const [open, setOpen] = useState(false)

	const onClose = useCallback(() => {
		setOpen(false)
	}, [])

	if (!action) {
		logger.info(
			`Invalid action name for automation ${props.automation.name}: $mainActionInstance.action`
		)
		return null
	}

	const automationIcon = props.automation.icon

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="ghost"
						className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
					>
						<DynamicIcon
							icon={(automationIcon as IconConfig) ?? undefined}
							size="14"
							className="flex-shrink-0"
						/>
						<span className="overflow-auto text-ellipsis">{props.automation.name}</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto p-0">
					<DialogHeader className="sticky inset-0 top-0 z-10 bg-white p-6 pb-2">
						<div className="flex items-start gap-x-2">
							<DynamicIcon
								icon={automationIcon as IconConfig}
								size="16"
								className="mt-0.5 flex-shrink-0"
							/>
							<DialogTitle className="flex items-baseline gap-x-2 pb-2">
								{props.automation.name}
							</DialogTitle>
						</div>
						<Separator />
					</DialogHeader>
					<div className="p-6 pt-0">
						<ActionForm
							action={action}
							values={mainActionInstance.config ?? {}}
							defaultFields={mainActionInstance.defaultedActionConfigKeys ?? []}
							onSubmit={onSubmit}
							submitButton={{
								text: "Run Automation",
								pendingText: "Running Automation...",
								successText: "Automation Ran",
								errorText: "Failed to run automation",
							}}
							secondaryButton={{
								text: "Cancel",
								onClick: onClose,
							}}
							context={{ type: "run", pubId: props.pubId }}
						>
							<Suspense fallback={<SkeletonCard />}>
								<ActionFormComponent />
							</Suspense>
						</ActionForm>
					</div>
				</DialogContent>
			</Dialog>
		</TokenProvider>
	)
}
