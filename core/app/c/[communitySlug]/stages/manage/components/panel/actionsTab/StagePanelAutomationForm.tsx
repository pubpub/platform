"use client"

import type { AutomationsId, Communities, CommunitiesId, StagesId } from "db/public"
import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form"
import type { IconConfig } from "ui/icon"
import type { Trigger } from "~/actions/_lib/triggers"
import type { getAutomation, getStageAutomations } from "~/lib/db/queries"
import type { AutoReturnType } from "~/lib/types"
import type { ConditionBlockFormValue } from "./ConditionBlock"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
	type Action,
	AutomationConditionBlockType,
	AutomationConditionType,
	AutomationEvent,
	automationsIdSchema,
	type ConditionEvaluationTiming,
	conditionEvaluationTimingSchema,
} from "db/public"
import { Button } from "ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Plus } from "ui/icon"
import { Input } from "ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { FormSubmitButton } from "ui/submit-button"
import { cn } from "utils"

import { ActionConfigBuilder } from "~/actions/_lib/ActionConfigBuilder"
import { ActionFormContext } from "~/actions/_lib/ActionForm"
import {
	getTriggerByName,
	humanReadableEventBase,
	isTriggerWithConfig,
	triggers,
} from "~/actions/_lib/triggers"
import { getTriggerConfigForm } from "~/actions/_lib/triggers/forms"
import { actions } from "~/actions/api"
import { getActionFormComponent } from "~/actions/forms"
import { isSequentialAutomationEvent } from "~/actions/types"
import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { entries } from "~/lib/mapping"
import { findRanksBetween } from "~/lib/rank"
import { isClientException, useServerAction } from "~/lib/serverActions"
import { addOrUpdateAutomation } from "../../../actions"
import { ConditionsBuilder } from "./ConditionsBuilder"
import { IconPicker } from "./IconPicker"

type Props = {
	stageId: StagesId
	communityId: CommunitiesId
	automations: AutoReturnType<typeof getAutomation>["execute"]
}

const AutomationSelector = ({
	fieldProps,
	label,
	placeholder,
	disabledAutomationId,
	dataTestIdPrefix,
	automations,
}: {
	fieldProps: ControllerRenderProps<
		CreateAutomationsSchema,
		`triggers.${number}.sourceAutomationId`
	>
	label: string
	placeholder: string
	disabledAutomationId?: AutomationsId
	dataTestIdPrefix?: string
	automations: Props["automations"]
}) => {
	return (
		<FormItem>
			<Select
				onValueChange={fieldProps.onChange}
				defaultValue={fieldProps.value}
				value={fieldProps.value}
			>
				<SelectTrigger data-testid={`${dataTestIdPrefix}-select-trigger`}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{automations.map((automation) => {
						const isDisabled = disabledAutomationId === automation.id
						return (
							<SelectItem
								key={automation.id}
								value={automation.id}
								className="hover:bg-gray-100"
								disabled={isDisabled}
								data-testid={`${dataTestIdPrefix}-select-item-${automation.id}`}
							>
								<div className="flex flex-row items-center gap-x-2">
									<span>{automation.name}</span>
									{isDisabled && (
										<span className="text-gray-400 text-xs">
											(self-reference not allowed)
										</span>
									)}
								</div>
							</SelectItem>
						)
					})}
				</SelectContent>
			</Select>
			<FormMessage />
		</FormItem>
	)
}

const conditionBlockSchema: z.ZodType<ConditionBlockFormValue> = z.lazy(() =>
	z.object({
		id: z.string().optional(),
		type: z.nativeEnum(AutomationConditionBlockType),
		kind: z.literal("block"),
		rank: z.string(),
		items: z
			.array(
				z.union([
					z.object({
						id: z.string().optional(),
						kind: z.literal("condition"),
						type: z.nativeEnum(AutomationConditionType),
						expression: z.string().min(1),
						rank: z.string(),
					}),
					conditionBlockSchema,
				])
			)
			.min(1),
	})
)

export type CreateAutomationsSchema = {
	name: string
	description?: string
	icon?: IconConfig
	condition?: ConditionBlockFormValue
	triggers: {
		event: AutomationEvent
		config: Record<string, unknown>
		sourceAutomationId: AutomationsId | undefined
	}[]
	action: {
		action: Action
		config: Record<string, unknown>
	}
	conditionEvaluationTiming: ConditionEvaluationTiming
}

export const StagePanelAutomationForm = (props: Props) => {
	const [currentlyEditingAutomationId, setCurrentlyEditingAutomationId] = useQueryState<
		AutomationsId | undefined
	>("automation-id", parseAsString)
	const schema = useMemo(
		() =>
			z
				.object({
					name: z.string().min(1, "Name is required"),
					description: z.string().optional(),
					icon: z
						.object({
							name: z.string(),
							variant: z.enum(["solid", "outline"]).optional(),
							color: z.string().optional(),
						})
						.optional(),
					conditionEvaluationTiming: conditionEvaluationTimingSchema.nullish(),
					condition: conditionBlockSchema.nullish(),
					triggers: z
						.array(
							z.discriminatedUnion(
								"event",
								entries(triggers).map(([event, automation]) =>
									z.object({
										event: z.literal(event),
										config:
											automation.config?.schema ?? z.object({}).optional(),
										sourceAutomationId: isSequentialAutomationEvent(event)
											? automationsIdSchema
											: z.null().optional(),
									})
								)
							)
						)
						.min(1, "At least one trigger is required"),

					action: z.discriminatedUnion(
						"action",
						entries(actions).map(([actionName, action]) =>
							z.object({
								action: z.literal(actionName),
								config: new ActionConfigBuilder(actionName)
									.withConfig(action.config.schema)
									.withDefaults({})
									.getSchema(),
							})
						)
					),
				})
				.superRefine((data, ctx) => {
					if (!data.triggers?.length) {
						return
					}

					for (const [idx, trigger] of data.triggers.entries()) {
						if (!isSequentialAutomationEvent(trigger.event)) {
							continue
						}
						if (!trigger.sourceAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message:
									"Source automation is required for automation chaining events",
							})
							continue
						}

						if (trigger.sourceAutomationId === currentlyEditingAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message: "Automations may not trigger themselves in a loop",
							})
						}
					}
				}),
		[props.stageId, currentlyEditingAutomationId]
	)

	const runUpsertAutomation = useServerAction(addOrUpdateAutomation)
	const [isOpen, setIsOpen] = useState(false)

	const currentAutomation = props.automations.find(
		(automation) => automation.id === currentlyEditingAutomationId
	)

	const form = useForm<CreateAutomationsSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			description: "",
			icon: undefined,
			action: {
				action: undefined,
				config: {},
			},
			triggers: [],
			condition: undefined,
			conditionEvaluationTiming: undefined,
		},
	})

	const { reset, setError } = form

	const community = useCommunity()

	const onSubmit = useCallback(
		async (data: CreateAutomationsSchema) => {
			const result = await runUpsertAutomation({
				stageId: props.stageId,
				data,
				automationId: currentlyEditingAutomationId as AutomationsId | undefined,
			})
			if (!isClientException(result)) {
				setIsOpen(false)
				setCurrentlyEditingAutomationId(null)
				reset()
				return
			}

			setError("root", { message: result.error })
		},
		[
			currentlyEditingAutomationId,
			props.stageId,
			runUpsertAutomation,
			setCurrentlyEditingAutomationId,
			reset,
			setError,
		]
	)

	useEffect(() => {
		if (!currentAutomation) {
			return
		}

		setIsOpen(true)
		const actionInstance = currentAutomation.actionInstances[0]

		reset({
			name: currentAutomation.name,
			description: currentAutomation.description ?? "",
			icon: currentAutomation.icon as IconConfig | undefined,
			action: {
				action: actionInstance?.action,
				config: actionInstance?.config ?? {},
			},
			triggers: currentAutomation.triggers,
			conditionEvaluationTiming: currentAutomation.conditionEvaluationTiming,
			condition: currentAutomation.condition,
		} as CreateAutomationsSchema)
	}, [currentAutomation, reset])

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				form.reset({
					name: "",
					description: "",
					icon: undefined,
					action: {
						action: undefined,
						config: {},
					},
					triggers: [],
					condition: undefined,
					conditionEvaluationTiming: undefined,
				})
				setCurrentlyEditingAutomationId(null)
			}
			setIsOpen(open)
		},
		[form, setCurrentlyEditingAutomationId]
	)

	const formId = useId()

	const selectedAction = useWatch({ control: form.control, name: "action" })

	const ActionFormComponent = useMemo(() => {
		if (!selectedAction?.action) {
			return null
		}

		return getActionFormComponent(selectedAction.action)
	}, [selectedAction?.action])

	useEffect(() => {
		if (selectedAction?.action) {
			form.setValue("action.config", {})
		}
	}, [selectedAction?.action, form])

	const isExistingAutomation = !!currentlyEditingAutomationId

	const condition = form.watch("condition")
	const _iconConfig = form.watch("icon")

	const {
		fields: selectedTriggers,
		append: appendTrigger,
		remove: removeTrigger,
	} = useFieldArray<CreateAutomationsSchema, "triggers">({
		control: form.control,
		name: "triggers",
	})

	console.log(form.formState.errors)

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary" data-testid="add-automation-button">
						Add automation
					</Button>
				</DialogTrigger>
				<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto p-0">
					<DialogHeader className="sticky inset-0 top-0 z-10 bg-white p-6 pb-2">
						<DialogTitle>
							{isExistingAutomation ? "Edit automation" : "Add automation"}
						</DialogTitle>
						<DialogDescription>
							Set up an automation to run whenever a certain event is triggered.
						</DialogDescription>
					</DialogHeader>

					<div className="p-6 pt-0">
						<Form {...form}>
							<form
								id={formId}
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-y-4"
							>
								<div className="flex items-end gap-x-2">
									<FormField
										control={form.control}
										name="icon"
										render={({ field }) => {
											return (
												<FormItem className="shrink">
													<FormLabel className="sr-only">
														Icon (optional)
													</FormLabel>
													<div className="flex items-center gap-2">
														<IconPicker
															value={field.value}
															onChange={field.onChange}
														/>
														{field.value && (
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() =>
																	field.onChange(undefined)
																}
															>
																Clear
															</Button>
														)}
													</div>
													<FormMessage />
												</FormItem>
											)
										}}
									/>
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => {
											return (
												<FormItem className="grow">
													<FormLabel>Name</FormLabel>
													<Input
														className="w-full"
														placeholder="Automation name"
														{...field}
													/>
													<FormMessage />
												</FormItem>
											)
										}}
									/>
								</div>

								<FormField
									control={form.control}
									name="triggers"
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>When</FormLabel>
												<div className="space-y-2">
													{field.value && field.value.length > 0 ? (
														<div className="flex flex-col gap-2">
															{field.value.map((trigger, idx) => {
																return (
																	<TriggerConfigForm
																		key={`${trigger.event}-${idx}`}
																		currentlyEditingAutomationId={
																			currentlyEditingAutomationId
																		}
																		stageAutomations={
																			props.automations
																		}
																		trigger={trigger}
																		form={form}
																		idx={idx}
																		community={community}
																		removeTrigger={() =>
																			removeTrigger(idx)
																		}
																	/>
																)
															})}
														</div>
													) : null}
													<Select
														onValueChange={(value) => {
															appendTrigger({
																event: value as AutomationEvent,
																config: {},
																sourceAutomationId: undefined,
															})
														}}
													>
														<SelectTrigger
															data-testid={`event-select-trigger`}
															className="h-auto w-full justify-start border-dashed"
														>
															<div className="flex items-center gap-2 py-1">
																<Plus
																	size={16}
																	className="text-neutral-500"
																/>
																<span className="text-neutral-600">
																	Add trigger
																</span>
															</div>
														</SelectTrigger>
														<SelectContent>
															{Object.values(AutomationEvent)
																.filter(
																	(event) =>
																		!field.value?.some(
																			(t) => t.event === event
																		)
																)
																.map((event) => {
																	const automation =
																		getTriggerByName(event)

																	return (
																		<SelectItem
																			key={event}
																			value={event}
																			className="hover:bg-gray-100"
																			data-testid={`trigger-select-item-${event}`}
																		>
																			<automation.display.icon className="mr-2 inline h-4 w-4 text-xs" />
																			{humanReadableEventBase(
																				event,
																				community
																			)}
																		</SelectItem>
																	)
																})}
														</SelectContent>
													</Select>
												</div>
												<FormMessage />
											</FormItem>
										)
									}}
								/>

								{selectedTriggers.length > 0 && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<FormLabel>Conditions (optional)</FormLabel>
											{!condition && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={() => {
														const ranks = findRanksBetween({
															numberOfRanks: 1,
														})
														form.setValue("condition", {
															type: AutomationConditionBlockType.OR,
															kind: "block",
															rank: ranks[0],
															items: [],
														})
													}}
												>
													<Plus size={14} />
													Add conditions
												</Button>
											)}
										</div>
										{condition && (
											<div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
												<ConditionsBuilder slug="condition" />
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-7 text-neutral-500 text-xs"
													onClick={() => {
														form.setValue("condition", undefined)
													}}
												>
													Remove all conditions
												</Button>
											</div>
										)}
									</div>
								)}

								{selectedTriggers.length > 0 && (
									<div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
										<FormField
											control={form.control}
											name="action.action"
											render={({ field }) => {
												const actionDef = field.value
													? actions[field.value]
													: null
												return (
													<FormItem>
														<FormLabel>Run</FormLabel>
														{field.value && actionDef ? (
															<div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white p-3">
																<actionDef.icon className="h-4 w-4 flex-shrink-0 text-neutral-600" />
																<span className="flex-1 font-medium text-neutral-900 text-sm">
																	{actionDef.name}
																</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="h-6 text-xs"
																	onClick={() => {
																		field.onChange(undefined)
																	}}
																>
																	Change
																</Button>
															</div>
														) : (
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
																value={field.value}
															>
																<SelectTrigger
																	data-testid="action-selector-select-trigger"
																	className="h-auto justify-start border-dashed"
																>
																	<SelectValue
																		placeholder={
																			<div className="flex items-center gap-2 py-1">
																				<Plus
																					size={16}
																					className="text-neutral-500"
																				/>
																				<span className="text-neutral-600">
																					Choose action
																				</span>
																			</div>
																		}
																	/>
																</SelectTrigger>
																<SelectContent>
																	{Object.entries(actions).map(
																		([actionName, action]) => {
																			return (
																				<SelectItem
																					key={actionName}
																					value={
																						actionName
																					}
																					className="hover:bg-gray-100"
																					data-testid={`action-selector-select-item-${actionName}`}
																				>
																					<div className="flex flex-row items-center gap-x-2">
																						<action.icon size="12" />
																						<span>
																							{
																								action.name
																							}
																						</span>
																					</div>
																				</SelectItem>
																			)
																		}
																	)}
																</SelectContent>
															</Select>
														)}
														<FormMessage />
													</FormItem>
												)
											}}
										/>

										{selectedAction?.action && ActionFormComponent && (
											<div className="space-y-2">
												<FormLabel>Action configuration</FormLabel>
												<div className="rounded-md border border-neutral-200 bg-white p-3">
													<ActionFormContext.Provider
														value={{
															action: actions[selectedAction.action],
															schema: actions[selectedAction.action]
																.config.schema,
															path: "action.config",
															form: form as UseFormReturn<any> as UseFormReturn<FieldValues>,
															defaultFields: [],
															context: { type: "automation" },
														}}
													>
														<ActionFormComponent />
													</ActionFormContext.Provider>
												</div>
											</div>
										)}
									</div>
								)}
							</form>
							{form.formState.errors.root && (
								<p
									className={
										"font-medium text-[0.8rem] text-red-500 dark:text-red-900"
									}
								>
									{form.formState.errors.root.message}
								</p>
							)}
						</Form>
						<DialogFooter
							className={cn(
								"-bottom-4 sticky mt-4 flex w-full items-center",
								currentlyEditingAutomationId && "!justify-between"
							)}
						>
							<FormSubmitButton
								form={formId}
								formState={form.formState}
								idleText="Save automation"
								pendingText="Saving automation..."
								successText="Automation saved"
								errorText="Error saving automation"
							/>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function TriggerConfigForm(props: {
	trigger: Trigger
	form: UseFormReturn<CreateAutomationsSchema>
	idx: number
	community: Communities
	removeTrigger: () => void
	currentlyEditingAutomationId: AutomationsId | undefined
	stageAutomations: AutoReturnType<typeof getStageAutomations>["execute"]
}) {
	const trigger = getTriggerByName(props.trigger.event)
	const TriggerForm = useMemo(() => {
		if (!isTriggerWithConfig(props.trigger.event)) {
			return null
		}

		return getTriggerConfigForm(props.trigger.event)
	}, [props.trigger.event])
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
			<div className="flex items-center gap-2">
				<trigger.display.icon className="h-4 w-4 flex-shrink-0 text-neutral-600" />
				<span className="flex-1 font-medium text-neutral-900 text-sm">
					{humanReadableEventBase(props.trigger.event, props.community)}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={props.removeTrigger}
				>
					<X size={14} />
				</Button>
			</div>

			{isSequentialAutomationEvent(props.trigger.event) && (
				<FormField
					control={props.form.control}
					name={`triggers.${props.idx}.sourceAutomationId`}
					render={({ field }) => (
						<AutomationSelector
							fieldProps={field}
							label="After"
							placeholder="Select automation to watch"
							disabledAutomationId={props.currentlyEditingAutomationId}
							dataTestIdPrefix="watched-automation"
							automations={props.stageAutomations}
						/>
					)}
				/>
			)}

			{trigger.config && TriggerForm && <TriggerForm form={props.form} idx={props.idx} />}
		</div>
	)
}
