"use client"

import type { CommunitiesId, PubsId } from "db/public"
import type { FullAutomation } from "db/types"
import type { LucideIcon } from "lucide-react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

import { Suspense, useCallback, useState } from "react"

import { logger } from "logger"
import { Button } from "ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog"
import { DynamicIcon, type IconConfig } from "ui/dynamic-icon"
import { Item, ItemContent, ItemHeader } from "ui/item"
import { Separator } from "ui/separator"
import { FormSubmitButton, FormSubmitButtonWithDropdown } from "ui/submit-button"
import { TokenProvider } from "ui/tokens"
import { toast } from "ui/use-toast"

import { ActionForm } from "~/actions/_lib/ActionForm"
import { getActionByName } from "~/actions/api"
import { runAutomationManual } from "~/actions/api/serverAction"
import { getActionFormComponent } from "~/actions/forms"
import { isActionSuccess } from "~/actions/results"
import { useServerAction } from "~/lib/serverActions"
import { useCommunity } from "../providers/CommunityProvider"
import { SkeletonCard } from "../skeletons/SkeletonCard"

type ActionCardProps = {
	icon: LucideIcon
	title: string
	children?: React.ReactNode
}

const ActionCard = (props: ActionCardProps) => {
	const Icon = props.icon

	return (
		<Item variant="outline" className="bg-neutral-50" size="sm">
			<ItemHeader>
				<Icon className="h-4 w-4 flex-shrink-0 text-neutral-600" />
				<span className="flex-1 font-medium text-neutral-900 text-sm">{props.title}</span>
			</ItemHeader>
			{props.children && (
				<ItemContent className="m-1 overflow-visible">{props.children}</ItemContent>
			)}
		</Item>
	)
}

type Props = {
	automation: Omit<FullAutomation, "lastAutomationRun">
	pubId: PubsId
	canOverrideAutomationConditions: boolean
}

export const AutomationRunForm = (props: Props) => {
	const mainActionInstance = props.automation.actionInstances[0]
	const action = getActionByName(mainActionInstance.action)
	const ActionFormComponent = getActionFormComponent(action.name)
	const community = useCommunity()
	const runAutomation = useServerAction(runAutomationManual)

	const hasConditions = Boolean(props.automation.condition)
	const showSkipConditionsOption = props.canOverrideAutomationConditions && hasConditions

	const onSubmit = useCallback(
		async (
			values: Record<string, unknown>,
			form: UseFormReturn<FieldValues>,
			options?: Record<string, unknown>
		) => {
			const skipConditionCheck = Boolean(options?.skipConditions)

			const result = await runAutomation({
				automationId: props.automation.id,
				pubId: props.pubId,
				manualActionInstancesOverrideArgs: {
					[mainActionInstance.id]: values,
				},
				communityId: community.id as CommunitiesId,
				stack: [],
				skipConditionCheck: skipConditionCheck && hasConditions,
			})

			console.log(result)
			if (isActionSuccess(result)) {
				console.log(result)
				toast({
					title:
						"title" in result && typeof result.title === "string"
							? result.title
							: `Successfully ran ${props.automation.name || action.niceName}`,
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
			action.niceName,
			hasConditions,
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
						<ActionCard icon={action.icon as LucideIcon} title={action.niceName}>
							<ActionForm
								action={action}
								values={mainActionInstance.config ?? {}}
								defaultFields={mainActionInstance.defaultedActionConfigKeys ?? []}
								onSubmit={onSubmit}
								submitButton={({ formState, submit }) =>
									showSkipConditionsOption ? (
										<FormSubmitButtonWithDropdown
											formState={formState}
											idleText="Run "
											pendingText="Running ..."
											successText="Done"
											errorText="Error"
											type="submit"
											dropdownOptions={[
												{
													label: "Run and skip conditions",
													onSelect: () =>
														submit({ skipConditions: true }),
												},
											]}
										/>
									) : (
										<FormSubmitButton
											formState={formState}
											idleText="Run"
											pendingText="Running ..."
											successText="Done"
											errorText="Error"
											type="submit"
										/>
									)
								}
								secondaryButton={{
									text: "Cancel",
									onClick: onClose,
								}}
								context={{
									type: "run",
									pubId: props.pubId,
									stageId: props.automation.stageId,
								}}
							>
								<Suspense fallback={<SkeletonCard />}>
									<ActionFormComponent />
								</Suspense>
							</ActionForm>
						</ActionCard>
					</div>
				</DialogContent>
			</Dialog>
		</TokenProvider>
	)
}
