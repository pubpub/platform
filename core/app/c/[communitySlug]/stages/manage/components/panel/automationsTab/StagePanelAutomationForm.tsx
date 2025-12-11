"use client"

import type { FullAutomation } from "db/types"
import type {
	ControllerFieldState,
	ControllerRenderProps,
	FieldValues,
	UseFormReturn,
} from "react-hook-form"
import type { IconConfig } from "ui/dynamic-icon"
import type { ZodTypeDef } from "zod"
import type { ActionConfigDefaultFields } from "~/lib/server/actions"
import type { ConditionBlockFormValue } from "./ConditionBlock"

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bolt, ChevronRight, Clock, X } from "lucide-react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
	type Action,
	type ActionInstancesId,
	AutomationConditionBlockType,
	AutomationConditionType,
	AutomationEvent,
	type Automations,
	type AutomationsId,
	type AutomationTriggersId,
	actionInstancesIdSchema,
	automationsIdSchema,
	automationTriggersIdSchema,
	type Communities,
	type CommunitiesId,
	type ConditionEvaluationTiming,
	conditionEvaluationTimingSchema,
	type StagesId,
} from "db/public"
import { Button } from "ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field"
import { Plus } from "ui/icon"
import { InfoButton } from "ui/info-button"
import { Input } from "ui/input"
import { Item, ItemContent, ItemHeader } from "ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { FormSubmitButton } from "ui/submit-button"
import { type TokenContext, TokenProvider } from "ui/tokens"
import { cn } from "utils"

import { ActionConfigBuilder } from "~/actions/_lib/ActionConfigBuilder"
import { ActionFormContext } from "~/actions/_lib/ActionForm"
import {
	getTriggerByName,
	humanReadableEventBase,
	humanReadableEventHydrated,
	triggers,
} from "~/actions/_lib/triggers"
import { isTriggerWithConfigForm, TriggerConfigForm } from "~/actions/_lib/triggers/forms"
import { actions } from "~/actions/api"
import { getActionFormComponent } from "~/actions/forms"
import { isSchedulableAutomationEvent, isSequentialAutomationEvent } from "~/actions/types"
import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { useUserOrThrow } from "~/app/components/providers/UserProvider"
import { entries } from "~/lib/mapping"
import { findRanksBetween } from "~/lib/rank"
import { isClientException, useServerAction } from "~/lib/serverActions"
import { addOrUpdateAutomation } from "../../../actions"
import { ConditionBlock } from "./ConditionBlock"
import { IconPicker } from "./IconPicker"
import { StagePanelActionCreator } from "./StagePanelActionCreator"

type Props = {
	currentAutomation: FullAutomation | null
	stageId: StagesId
	communityId: CommunitiesId
	automations: FullAutomation[]
	actionConfigDefaults: ActionConfigDefaultFields
	onSuccess?: () => void
}

const AutomationSelector = ({
	fieldProps,
	fieldState,
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
	fieldState: ControllerFieldState
	label: string
	placeholder: string
	disabledAutomationId?: AutomationsId
	dataTestIdPrefix?: string
	automations: { id: AutomationsId; name: string }[]
}) => {
	return (
		<Field data-invalid={fieldState.invalid}>
			<FieldLabel>{label}</FieldLabel>
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
								data-testid={`${dataTestIdPrefix}-select-item-${automation.name}`}
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
			{fieldState.error && (
				<FieldError className="text-xs">{fieldState.error.message}</FieldError>
			)}
		</Field>
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
		triggerId: AutomationTriggersId
		event: AutomationEvent
		config: Record<string, unknown>
		sourceAutomationId?: AutomationsId | undefined
	}[]
	action: {
		actionInstanceId?: ActionInstancesId
		action: Action
		config: Record<string, unknown>
	}
	conditionEvaluationTiming: ConditionEvaluationTiming
}

type ConfigCardProps = {
	icon: typeof ChevronRight
	title: React.ReactNode
	onRemove: () => void
	children?: React.ReactNode
	showCollapseToggle?: boolean
	isError?: boolean
	defaultCollapsed?: boolean
	dataTestIdPrefix?: string
}

const ConfigCard = memo(
	function ConfigCard(props: ConfigCardProps) {
		const [isCollapsed, setIsCollapsed] = useState(props.defaultCollapsed ?? false)
		const hasContent = !!props.children
		const Icon = props.icon

		return (
			<Collapsible
				open={!isCollapsed}
				onOpenChange={(open) => setIsCollapsed(!open)}
				defaultOpen={!props.defaultCollapsed}
			>
				<Item variant="outline" className="rounded-lg bg-neutral-50" size="sm">
					<ItemHeader className={cn(props.isError && "text-destructive")}>
						{props.showCollapseToggle && hasContent ? (
							<CollapsibleTrigger
								data-testid={`${props.dataTestIdPrefix}-collapse-trigger`}
								asChild
							>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 items-center justify-start p-0 hover:bg-transparent has-[>svg]:px-0"
								>
									<span className="sr-only">
										{isCollapsed ? "Expand" : "Collapse"}
									</span>
									<ChevronRight
										size={14}
										className={cn(
											"transition-transform duration-200 ease-out",
											!isCollapsed && "rotate-90"
										)}
									/>

									<Icon
										className={cn(
											"h-4 w-4 flex-shrink-0 text-neutral-600",
											props.isError && "text-destructive"
										)}
									/>
									<span
										className={cn(
											"flex-1 text-left font-medium text-neutral-900 text-sm",
											props.isError && "text-destructive"
										)}
									>
										{props.title}
									</span>
								</Button>
							</CollapsibleTrigger>
						) : (
							<>
								<Icon
									className={cn(
										"h-4 w-4 flex-shrink-0 text-neutral-600",
										props.isError && "text-destructive"
									)}
								/>
								<span
									className={cn(
										"flex-1 font-medium text-neutral-900 text-sm",
										props.isError && "text-destructive"
									)}
								>
									{props.title}
								</span>
							</>
						)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={props.onRemove}
						>
							<span className="sr-only">Remove</span>
							<X size={14} />
						</Button>
					</ItemHeader>

					<CollapsibleContent className={cn(!hasContent ? "hidden" : "w-full")}>
						<ItemContent className="m-1 overflow-visible">{props.children}</ItemContent>
					</CollapsibleContent>
				</Item>
			</Collapsible>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.icon === nextProps.icon &&
			prevProps.title === nextProps.title &&
			prevProps.isError === nextProps.isError &&
			prevProps.showCollapseToggle === nextProps.showCollapseToggle &&
			prevProps.defaultCollapsed === nextProps.defaultCollapsed &&
			prevProps.children === nextProps.children
		)
	}
)

const ConditionFieldSection = memo(
	function ConditionFieldSection(props: {
		form: UseFormReturn<CreateAutomationsSchema>
		condition: ConditionBlockFormValue | undefined
	}) {
		return (
			<Controller
				control={props.form.control}
				name="condition"
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<div className="flex items-center justify-between">
							<FieldLabel>Conditions (optional)</FieldLabel>
							{!props.condition ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 text-xs"
									onClick={() => {
										const ranks = findRanksBetween({
											numberOfRanks: 1,
										})
										field.onChange({
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
							) : (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-neutral-500 text-xs"
									onClick={() => {
										field.onChange(undefined)
									}}
								>
									Remove all conditions
								</Button>
							)}
						</div>
						{props.condition && (
							<>
								<FieldDescription>
									Define conditions that must be met for this automation to run.
									Use JSONata expressions to construct a boolean value like{" "}
									<code>'Hello' in $.pub.values.title</code>.
								</FieldDescription>
								<ConditionBlock
									control={props.form.control}
									fieldState={fieldState}
									slug={"condition"}
									id={"root-block"}
								/>
							</>
						)}
						{fieldState.error && (
							<FieldError className="text-xs">{fieldState.error.message}</FieldError>
						)}
					</Field>
				)}
			/>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.condition === nextProps.condition
	}
)

export function StagePanelAutomationForm(props: Props) {
	const schema = useMemo(
		() =>
			z
				.object({
					name: z.string().min(1, "Name is required"),
					description: z.string().nullish(),
					icon: z
						.object({
							name: z.string(),
							variant: z.enum(["solid", "outline"]).nullish(),
							color: z.string().nullish(),
						})
						.nullish(),
					conditionEvaluationTiming: conditionEvaluationTimingSchema.nullish(),
					condition: conditionBlockSchema.nullish(),
					triggers: z
						.array(
							z.discriminatedUnion(
								"event",

								entries(triggers).map(([event, automation]) =>
									z.object({
										triggerId: automationTriggersIdSchema,
										event: z.literal(event),
										...(automation.config ? { config: automation.config } : {}),
										...(isSequentialAutomationEvent(event)
											? { sourceAutomationId: automationsIdSchema }
											: {}),
									})
								) as unknown as [
									z.ZodObject<{
										triggerId: typeof automationTriggersIdSchema
										event: z.ZodLiteral<AutomationEvent>
										config: z.ZodObject<any>
										sourceAutomationId: z.ZodOptional<
											z.ZodType<AutomationsId, ZodTypeDef, AutomationsId>
										>
									}>,
									...z.ZodObject<{
										triggerId: typeof automationTriggersIdSchema
										event: z.ZodLiteral<AutomationEvent>
										config: z.ZodObject<any>
										sourceAutomationId: z.ZodOptional<
											z.ZodType<AutomationsId, ZodTypeDef, AutomationsId>
										>
									}>[],
								]
							)
						)
						.min(1, "At least one trigger is required"),

					action: z.discriminatedUnion(
						"action",
						entries(actions).map(([actionName]) =>
							z.object({
								actionInstanceId: actionInstancesIdSchema,
								action: z.literal(actionName),
								config: new ActionConfigBuilder(actionName)
									.withDefaults({})
									.getSchema(),
							})
						) as [
							z.ZodObject<{
								actionInstanceId: typeof actionInstancesIdSchema
								action: z.ZodLiteral<Action>
								config: z.ZodObject<any>
							}>,
							...z.ZodObject<{
								actionInstanceId: typeof actionInstancesIdSchema
								action: z.ZodLiteral<Action>
								config: z.ZodObject<any>
							}>[],
						],
						{
							message: "Action is required",
							errorMap: (issue, ctx) => {
								if (
									issue.code === z.ZodIssueCode.invalid_union_discriminator ||
									!issue.message
								) {
									return { message: "Action is required" }
								}

								return { message: issue.message }
							},
						}
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

						if (trigger.sourceAutomationId === props.currentAutomation?.id) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message: "Automations may not trigger themselves in a loop",
							})
						}
					}
				}),
		[props.currentAutomation?.id]
	)

	const runUpsertAutomation = useServerAction(addOrUpdateAutomation)

	const defaultValues = useMemo(() => {
		if (!props.currentAutomation) {
			return {
				name: "",
				description: "",
				icon: undefined,
				action: {
					actionInstanceId: undefined,
					action: undefined,
					config: {},
				},
				triggers: [],
				condition: undefined,
				conditionEvaluationTiming: undefined,
			}
		}

		const actionInstance = props.currentAutomation.actionInstances[0]

		return {
			name: props.currentAutomation.name,
			description: props.currentAutomation.description ?? "",
			icon: props.currentAutomation.icon as IconConfig | undefined,
			action: {
				actionInstanceId: actionInstance?.id,
				action: actionInstance?.action,
				config: actionInstance?.config ?? {},
			},
			triggers: props.currentAutomation.triggers.map((trigger) => ({
				triggerId: trigger.id,
				event: trigger.event,
				config: trigger.config,
				sourceAutomationId: trigger.sourceAutomationId,
			})),
			conditionEvaluationTiming: props.currentAutomation.conditionEvaluationTiming,
			condition: props.currentAutomation.condition,
		} as CreateAutomationsSchema
	}, [props.currentAutomation])

	const form = useForm<CreateAutomationsSchema>({
		resolver: zodResolver(schema),
		defaultValues,
	})

	const { setError } = form

	const { user } = useUserOrThrow()

	const onSubmit = useCallback(
		async (data: CreateAutomationsSchema) => {
			const result = await runUpsertAutomation({
				stageId: props.stageId,
				data,
				automationId: props.currentAutomation?.id as AutomationsId | undefined,
			})
			if (!isClientException(result)) {
				props.onSuccess?.()
				return
			}

			setError("root", { message: result.error })
		},
		[props.currentAutomation?.id, props.stageId, runUpsertAutomation, props.onSuccess, setError]
	)

	const formId = useId()

	const selectedAction = useWatch({ control: form.control, name: "action" })

	// track the initial action to detect when the user changes the action type
	// using a ref to avoid triggering the effect when we update the tracking value
	const initialActionRef = useRef<string | undefined>(defaultValues.action?.action)

	useEffect(() => {
		if (!selectedAction?.action) {
			return
		}

		// if this is the first time we're seeing this action (matches initial), don't clear
		if (initialActionRef.current === selectedAction.action) {
			return
		}

		// action type changed, clear the config and update the ref
		form.setValue("action.config", {})
		initialActionRef.current = selectedAction.action
	}, [selectedAction?.action, form])

	const condition = form.watch("condition")

	const {
		fields: selectedTriggers,
		append: appendTrigger,
		// this doesnt seem to work properly, see https://github.com/react-hook-form/react-hook-form/issues/12791
		remove: _removeTrigger,
	} = useFieldArray<CreateAutomationsSchema, "triggers">({
		control: form.control,
		name: "triggers",
	})

	const errors = form.formState.errors

	const _hasCondition = Boolean(condition)
	const needsConditionEvaluationTiming = selectedTriggers.some((trigger) =>
		isSchedulableAutomationEvent(trigger.event)
	)

	return (
		<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-6">
			<div className="flex flex-col gap-y-2">
				<div className="flex items-start gap-x-2">
					<Controller
						control={form.control}
						name="icon"
						render={({ field, fieldState }) => {
							return (
								<Field className="w-9" data-invalid={fieldState.invalid}>
									<FieldLabel>
										<span className="sr-only">Icon</span>
										{/* okay this is evil but i just don't want to show the label it looks bad */}
										<span className="w-full pt-[18px]"></span>
									</FieldLabel>
									<IconPicker value={field.value} onChange={field.onChange} />
								</Field>
							)
						}}
					/>
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => {
							return (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Name</FieldLabel>
									<Input placeholder="Automation name" {...field} />
								</Field>
							)
						}}
					/>
				</div>
				{errors.icon && (
					<FieldError className="text-xs">Icon Error: {errors.icon.message}</FieldError>
				)}
				{errors.name && (
					<FieldError className="text-xs">Name Error: {errors.name.message}</FieldError>
				)}
			</div>

			<Controller
				control={form.control}
				name="triggers"
				render={(controlProps) => (
					<TriggerField
						{...controlProps}
						automations={props.automations}
						currentAutomation={props.currentAutomation}
						form={form}
						appendTrigger={appendTrigger}
					/>
				)}
			/>

			{selectedTriggers.length > 0 && (
				<>
					<ConditionFieldSection form={form} condition={condition} />
					{condition && needsConditionEvaluationTiming && (
						<Controller
							control={form.control}
							name="conditionEvaluationTiming"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className="text-xs">
										When to evaluate the condition
										<InfoButton>
											<p className="text-xs">
												For duration-based triggers, conditions can be
												evaluated at two points: when the automation is
												scheduled (eg, whenever as Pub enters the stage) and
												when it actually executes (after the duration
												passes).
												<br />
												<br />
												"When scheduled" only schedules the automation if
												the condition is met initially, useful for static
												conditions like pub type.
												<br />
												<br />
												"On execution" schedules all automations but checks
												the condition at runtime, useful for dynamic
												conditions that may change over time (like "author
												has replied").
												<br />
												<br />
												"Both" is the most restrictive option, requiring the
												condition to be true at both scheduling and
												execution time, which minimizes unnecessary
												scheduled jobs while ensuring the condition still
												holds when the automation runs.
											</p>
										</InfoButton>
									</FieldLabel>
									<Select
										value={field.value ?? "both"}
										onValueChange={field.onChange}
										defaultValue="both"
									>
										<SelectTrigger data-testid="condition-evaluation-timing-select-trigger">
											<SelectValue
												placeholder="Select condition evaluation timing"
												className="text-xs"
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="onTrigger">
												<div className="flex items-center text-xs">
													<Clock className="mr-2 inline h-4 w-4 text-xs" />
													When the automation is scheduled
												</div>
											</SelectItem>
											<SelectItem value="onExecution">
												<div className="flex items-center text-xs">
													<Bolt className="mr-2 inline h-4 w-4 text-xs" />
													When the automation is executed
												</div>
											</SelectItem>
											<SelectItem value="both">
												<div className="flex items-center text-xs">
													When the automation is scheduled and again when
													it is executed
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
					)}
				</>
			)}

			{selectedTriggers.length > 0 && (
				<Controller
					control={form.control}
					name="action"
					render={({ field, fieldState }) => {
						return (
							<Field>
								<FieldLabel>Run</FieldLabel>
								<div className="space-y-2">
									{field.value?.action ? (
										<ActionConfigCardWrapper
											stageId={props.stageId}
											action={field.value.action}
											defaults={
												props.actionConfigDefaults[field.value.action]
											}
											form={form}
											onChange={field.onChange}
											isEditing={!!props.currentAutomation?.id}
										/>
									) : null}
									{!field.value?.action && (
										<StagePanelActionCreator
											onAdd={(actionName) => {
												form.setValue("action", {
													actionInstanceId:
														crypto.randomUUID() as ActionInstancesId,
													action: actionName,
													config: {},
												})
											}}
											isSuperAdmin={user?.isSuperAdmin}
										>
											<Button
												data-testid="action-selector-select-trigger"
												variant="ghost"
												className="h-auto w-full justify-start border border-dashed bg-transparent"
											>
												<div className="flex items-center gap-2 py-1">
													<Plus size={16} className="text-neutral-500" />
													<span className="text-neutral-600">
														Add action
													</span>
												</div>
											</Button>
										</StagePanelActionCreator>
									)}
								</div>
								{fieldState.error && (
									<FieldError className="text-xs">
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						)
					}}
				/>
			)}

			{form.formState.errors.root && (
				<FieldError className="text-xs">{form.formState.errors.root?.message}</FieldError>
			)}

			<FormSubmitButton
				form={formId}
				formState={form.formState}
				idleText="Save automation"
				pendingText="Saving automation..."
				successText="Automation saved"
				errorText="Error saving automation"
			/>
		</form>
	)
}

const TriggerConfigCard = memo(
	function TriggerConfigCard(props: {
		trigger: CreateAutomationsSchema["triggers"][number]
		form: UseFormReturn<CreateAutomationsSchema>
		idx: number
		community: Communities
		removeTrigger: () => void
		currentAutomation: FullAutomation | null
		stageAutomations: Automations[]
		isEditing: boolean
	}) {
		const trigger = getTriggerByName(props.trigger.event)

		const triggerForm = useMemo(() => {
			const pr = {
				event: props.trigger.event,
				// FIXME: terrible typescript going on here, overcomplicated
				form: props.form as UseFormReturn<any>,
				idx: props.idx,
			}

			if (!isTriggerWithConfigForm(pr, props.trigger.event)) {
				return null
			}

			return <TriggerConfigForm {...pr} />
		}, [props.trigger.event, props.form, props.idx])

		if (!trigger) {
			return null
		}

		const hasConfig = Boolean(
			isSequentialAutomationEvent(props.trigger.event) || (trigger?.config && triggerForm)
		)

		if (!hasConfig) {
			return (
				<ConfigCard
					icon={trigger.display.icon}
					dataTestIdPrefix={`trigger-config-card-${props.trigger.event}`}
					title={
						props.currentAutomation
							? humanReadableEventHydrated(props.trigger.event, props.community, {
									automation: props.currentAutomation,
									config: props.trigger.config ?? null,
									sourceAutomation: props.trigger.sourceAutomationId
										? props.stageAutomations.find(
												(a) => a.id === props.trigger.sourceAutomationId
											)
										: undefined,
								})
							: humanReadableEventBase(props.trigger.event, props.community)
					}
					onRemove={props.removeTrigger}
					showCollapseToggle={false}
					defaultCollapsed={true}
				/>
			)
		}

		return (
			<ConfigCard
				icon={trigger.display.icon}
				title={humanReadableEventBase(props.trigger.event, props.community)}
				onRemove={props.removeTrigger}
				showCollapseToggle={hasConfig}
				defaultCollapsed={props.isEditing || !hasConfig}
			>
				{isSequentialAutomationEvent(props.trigger.event) && (
					<Controller
						control={props.form.control}
						name={`triggers.${props.idx}.sourceAutomationId`}
						render={({ field, fieldState }) => (
							<AutomationSelector
								fieldProps={field}
								fieldState={fieldState}
								label="After"
								placeholder="Select automation to watch"
								disabledAutomationId={props.currentAutomation?.id ?? undefined}
								dataTestIdPrefix="watched-automation"
								automations={props.stageAutomations}
							/>
						)}
					/>
				)}
				{triggerForm}
			</ConfigCard>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.trigger.event === nextProps.trigger.event &&
			prevProps.trigger.triggerId === nextProps.trigger.triggerId &&
			prevProps.idx === nextProps.idx &&
			prevProps.isEditing === nextProps.isEditing &&
			prevProps.currentAutomation?.id === nextProps.currentAutomation?.id
		)
	}
)

function ActionConfigCardWrapper(props: {
	action: Action
	stageId: StagesId | null
	form: UseFormReturn<CreateAutomationsSchema>
	onChange: (value: {
		actionInstanceId?: ActionInstancesId
		action: Action | undefined
		config: Record<string, unknown>
	}) => void
	isEditing: boolean
	defaults?: string[]
}) {
	const removeAction = useCallback(() => {
		props.onChange({
			actionInstanceId: undefined,
			action: undefined,
			config: {},
		})
	}, [props.onChange])

	return (
		<ActionConfigCard
			stageId={props.stageId}
			action={props.action}
			form={props.form}
			removeAction={removeAction}
			isEditing={props.isEditing}
			defaults={props.defaults}
		/>
	)
}

const ActionConfigCard = memo(
	function ActionConfigCard(props: {
		action: Action
		form: UseFormReturn<CreateAutomationsSchema>
		removeAction: () => void
		isEditing: boolean
		stageId: StagesId | null
		defaults?: string[]
	}) {
		const actionDef = actions[props.action]
		const ActionFormComponent = useMemo(() => {
			return getActionFormComponent(props.action)
		}, [props.action])

		const translatedDefaults = useMemo(() => {
			return props.defaults?.map((key) => `action.config.${key}`) ?? []
		}, [props.defaults])

		const translatedTokens = useMemo(() => {
			return Object.entries(actionDef.tokens ?? {}).reduce((acc, [key, value]) => {
				acc[`action.config.${key}`] = value
				return acc
			}, {} as TokenContext)
		}, [actionDef.tokens])

		if (!ActionFormComponent) {
			return null
		}

		return (
			<Controller
				control={props.form.control}
				name="action.config"
				render={({ fieldState }) => {
					return (
						<ConfigCard
							isError={fieldState.invalid}
							dataTestIdPrefix={`action-config-card-${actionDef.name}`}
							icon={actionDef.icon as typeof ChevronRight}
							title={actionDef.niceName}
							onRemove={props.removeAction}
							showCollapseToggle={true}
							defaultCollapsed={props.isEditing}
						>
							<TokenProvider tokens={translatedTokens}>
								<ActionFormContext.Provider
									value={{
										action: actionDef,
										schema: actionDef.config.schema,
										path: "action.config",
										form: props.form as UseFormReturn<any> as UseFormReturn<FieldValues>,
										defaultFields: translatedDefaults,
										context: {
											type: "automation",
											stageId: props.stageId,
										},
									}}
								>
									<ActionFormComponent />
								</ActionFormContext.Provider>
								{fieldState.error && (
									<FieldError className="text-xs">
										{fieldState.error.message}
									</FieldError>
								)}
							</TokenProvider>
						</ConfigCard>
					)
				}}
			/>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.action === nextProps.action && prevProps.isEditing === nextProps.isEditing
	}
)

export const TriggerField = (props: {
	field: ControllerRenderProps<CreateAutomationsSchema, "triggers">
	fieldState: ControllerFieldState
	automations: Automations[]
	currentAutomation: FullAutomation | null
	form: UseFormReturn<CreateAutomationsSchema>
	appendTrigger: (trigger: CreateAutomationsSchema["triggers"][number]) => void
}) => {
	const community = useCommunity()

	const selectTriggers = useMemo(() => {
		return Object.values(AutomationEvent)
			.filter((event) => !props.field.value?.some((t) => t.event === event))
			.sort((a, b) => {
				// Put "manual" trigger first
				if (a === AutomationEvent.manual) return -1
				if (b === AutomationEvent.manual) return 1
				return 0
			})
			.map((event) => {
				const automation = getTriggerByName(event)

				return (
					<SelectItem
						key={event}
						value={event}
						className="hover:bg-gray-100"
						data-testid={`trigger-select-item-${event}`}
					>
						<automation.display.icon className="mr-2 inline h-4 w-4 text-xs" />
						{humanReadableEventBase(event, community)}
					</SelectItem>
				)
			})
	}, [props.field.value, community])

	return (
		<Field data-invalid={props.fieldState.invalid}>
			<FieldLabel>When</FieldLabel>
			<div className="space-y-2">
				{props.field.value && props.field.value.length > 0
					? props.field.value.map((field, idx) => {
							return (
								<Controller
									control={props.form.control}
									name={`triggers.${idx}`}
									key={field.triggerId}
									render={({ field }) => (
										<TriggerConfigCard
											currentAutomation={props.currentAutomation}
											stageAutomations={props.automations}
											trigger={field.value}
											form={props.form}
											idx={idx}
											community={community}
											removeTrigger={() => {
												props.field.onChange(
													props.field.value.filter(
														(t) => t.triggerId !== field.value.triggerId
													)
												)
											}}
											isEditing={!!props.currentAutomation?.id}
										/>
									)}
								/>
							)
						})
					: null}
				<Select
					onValueChange={(value) => {
						props.appendTrigger({
							triggerId: crypto.randomUUID() as AutomationTriggersId,
							event: value as AutomationEvent,
							config: {},
							sourceAutomationId: undefined,
						})
					}}
				>
					<SelectTrigger
						data-testid={`event-select-trigger`}
						className="h-12 w-full justify-start rounded-lg border-dashed"
					>
						<div className="flex items-center gap-2 py-1">
							<Plus size={16} className="text-neutral-500" />
							<span className="text-neutral-600">Add trigger</span>
						</div>
					</SelectTrigger>
					<SelectContent>{selectTriggers}</SelectContent>
				</Select>
			</div>
			{props.fieldState.error && (
				<FieldError className="text-xs">{props.fieldState.error.message}</FieldError>
			)}
		</Field>
	)
}
