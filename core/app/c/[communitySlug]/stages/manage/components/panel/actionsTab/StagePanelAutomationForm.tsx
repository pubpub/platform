"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
	AutomationsId,
	Communities,
	CommunitiesId,
	StagesId,
} from "db/public";
import {
	type Action,
	AutomationConditionBlockType,
	AutomationConditionType,
	AutomationEvent,
	automationsIdSchema,
	type ConditionEvaluationTiming,
	conditionEvaluationTimingSchema,
} from "db/public";
import { ChevronRight, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type {
	ControllerRenderProps,
	FieldValues,
	UseFormReturn,
} from "react-hook-form";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Form, FormField, FormItem, FormMessage } from "ui/form";
import type { IconConfig } from "ui/icon";
import { Plus } from "ui/icon";
import { Input } from "ui/input";
import { Item, ItemContent, ItemHeader } from "ui/item";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "ui/select";
import { FormSubmitButton } from "ui/submit-button";
import { cn } from "utils";
import { z } from "zod";
import { ActionConfigBuilder } from "~/actions/_lib/ActionConfigBuilder";
import { ActionFormContext } from "~/actions/_lib/ActionForm";
import type { Trigger } from "~/actions/_lib/triggers";
import {
	getTriggerByName,
	humanReadableEventBase,
	isTriggerWithConfig,
	triggers,
} from "~/actions/_lib/triggers";
import { getTriggerConfigForm } from "~/actions/_lib/triggers/forms";
import { actions } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { isSequentialAutomationEvent } from "~/actions/types";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import {
	useUser,
	useUserOrThrow,
} from "~/app/components/providers/UserProvider";
import type { getAutomation, getStageAutomations } from "~/lib/db/queries";
import { entries } from "~/lib/mapping";
import { findRanksBetween } from "~/lib/rank";
import { isClientException, useServerAction } from "~/lib/serverActions";
import type { AutoReturnType } from "~/lib/types";
import { addOrUpdateAutomation } from "../../../actions";
import { ConditionBlock, type ConditionBlockFormValue } from "./ConditionBlock";
import { IconPicker } from "./IconPicker";
import { StagePanelActionCreator } from "./StagePanelActionCreator";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	automations: AutoReturnType<typeof getAutomation>["execute"];
};

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
	>;
	label: string;
	placeholder: string;
	disabledAutomationId?: AutomationsId;
	dataTestIdPrefix?: string;
	automations: Props["automations"];
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
						const isDisabled = disabledAutomationId === automation.id;
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
						);
					})}
				</SelectContent>
			</Select>
			<FormMessage />
		</FormItem>
	);
};

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
				]),
			)
			.min(1),
	}),
);

export type CreateAutomationsSchema = {
	name: string;
	description?: string;
	icon?: IconConfig;
	condition?: ConditionBlockFormValue;
	triggers: {
		event: AutomationEvent;
		config: Record<string, unknown>;
		sourceAutomationId: AutomationsId | undefined;
	}[];
	action: {
		action: Action;
		config: Record<string, unknown>;
	};
	conditionEvaluationTiming: ConditionEvaluationTiming;
};

export const StagePanelAutomationForm = (props: Props) => {
	const [currentlyEditingAutomationId, setCurrentlyEditingAutomationId] =
		useQueryState<AutomationsId | undefined>("automation-id", parseAsString);
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
										event: z.literal(event),
										config:
											automation.config?.schema ?? z.object({}).optional(),
										sourceAutomationId: isSequentialAutomationEvent(event)
											? automationsIdSchema
											: z.null().optional(),
									}),
								),
							),
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
							}),
						),
						{
							message: "Action is required",
							errorMap: (issue, ctx) => {
								if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
									return "Action is required";
								}
							},
						},
					),
				})
				.superRefine((data, ctx) => {
					if (!data.triggers?.length) {
						return;
					}

					for (const [idx, trigger] of data.triggers.entries()) {
						if (!isSequentialAutomationEvent(trigger.event)) {
							continue;
						}
						if (!trigger.sourceAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message:
									"Source automation is required for automation chaining events",
							});
							continue;
						}

						if (trigger.sourceAutomationId === currentlyEditingAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message: "Automations may not trigger themselves in a loop",
							});
						}
					}
				}),
		[props.stageId, currentlyEditingAutomationId],
	);

	const runUpsertAutomation = useServerAction(addOrUpdateAutomation);
	const [isOpen, setIsOpen] = useState(false);

	const currentAutomation = props.automations.find(
		(automation) => automation.id === currentlyEditingAutomationId,
	);

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
	});

	const { reset, setError } = form;

	const { user } = useUserOrThrow();

	const community = useCommunity();

	const onSubmit = useCallback(
		async (data: CreateAutomationsSchema) => {
			const result = await runUpsertAutomation({
				stageId: props.stageId,
				data,
				automationId: currentlyEditingAutomationId as AutomationsId | undefined,
			});
			if (!isClientException(result)) {
				setIsOpen(false);
				setCurrentlyEditingAutomationId(null);
				reset();
				return;
			}

			setError("root", { message: result.error });
		},
		[
			currentlyEditingAutomationId,
			props.stageId,
			runUpsertAutomation,
			setCurrentlyEditingAutomationId,
			reset,
			setError,
		],
	);

	useEffect(() => {
		if (!currentAutomation) {
			return;
		}

		setIsOpen(true);
		const actionInstance = currentAutomation.actionInstances[0];

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
		} as CreateAutomationsSchema);
	}, [currentAutomation, reset]);

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
				});
				setCurrentlyEditingAutomationId(null);
			}
			setIsOpen(open);
		},
		[form, setCurrentlyEditingAutomationId],
	);

	const formId = useId();

	const selectedAction = useWatch({ control: form.control, name: "action" });

	useEffect(() => {
		if (selectedAction?.action) {
			form.setValue("action.config", {});
		}
	}, [selectedAction?.action, form]);

	const isExistingAutomation = !!currentlyEditingAutomationId;

	const condition = form.watch("condition");
	const _iconConfig = form.watch("icon");

	const {
		fields: selectedTriggers,
		append: appendTrigger,
		remove: removeTrigger,
	} = useFieldArray<CreateAutomationsSchema, "triggers">({
		control: form.control,
		name: "triggers",
	});

	const errors = form.formState.errors;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					data-testid="add-automation-button"
					className="m-0 h-6 p-0 text-neutral-700 hover:bg-transparent hover:text-neutral-900"
				>
					<Plus size={16} /> Add automation
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
							className="flex flex-col gap-y-6"
						>
							<div className="flex flex-col gap-y-2">
								<div className="flex items-start gap-x-2">
									<Controller
										control={form.control}
										name="icon"
										render={({ field, fieldState }) => {
											return (
												<Field
													className="w-9"
													data-invalid={fieldState.invalid}
												>
													<FieldLabel>
														<span className="sr-only">Icon</span>
														{/* okay this is evil but i just don't want to show the label it looks bad */}
														<span className="w-full pt-[18px]"></span>
													</FieldLabel>
													<IconPicker
														value={field.value}
														onChange={field.onChange}
													/>
												</Field>
											);
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
											);
										}}
									/>
								</div>
								{errors.icon && (
									<FieldError className="text-xs">
										Icon Error: {errors.icon.message}
									</FieldError>
								)}
								{errors.name && (
									<FieldError className="text-xs">
										Name Error: {errors.name.message}
									</FieldError>
								)}
							</div>

							<Controller
								control={form.control}
								name="triggers"
								render={({ field, fieldState }) => {
									return (
										<div className="space-y-2">
											<FieldLabel>When</FieldLabel>
											<div className="space-y-2">
												{field.value && field.value.length > 0
													? field.value.map((trigger, idx) => {
															return (
																<TriggerConfigCard
																	key={`${trigger.event}-${idx}`}
																	currentlyEditingAutomationId={
																		currentlyEditingAutomationId
																	}
																	stageAutomations={props.automations}
																	trigger={trigger}
																	form={form}
																	idx={idx}
																	community={community}
																	removeTrigger={() => removeTrigger(idx)}
																	isEditing={!!currentlyEditingAutomationId}
																/>
															);
														})
													: null}
												<Select
													onValueChange={(value) => {
														appendTrigger({
															event: value as AutomationEvent,
															config: {},
															sourceAutomationId: undefined,
														});
													}}
												>
													<SelectTrigger
														data-testid={`event-select-trigger`}
														className="h-auto w-full justify-start border-dashed"
													>
														<div className="flex items-center gap-2 py-1">
															<Plus size={16} className="text-neutral-500" />
															<span className="text-neutral-600">
																Add trigger
															</span>
														</div>
													</SelectTrigger>
													<SelectContent>
														{Object.values(AutomationEvent)
															.filter(
																(event) =>
																	!field.value?.some((t) => t.event === event),
															)
															.map((event) => {
																const automation = getTriggerByName(event);

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
																);
															})}
													</SelectContent>
												</Select>
											</div>
											{fieldState.error && (
												<FieldError className="text-xs">
													{fieldState.error.message}
												</FieldError>
											)}
										</div>
									);
								}}
							/>

							{selectedTriggers.length > 0 && (
								<Controller
									control={form.control}
									name="condition"
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<div className="flex items-center justify-between">
												<FieldLabel>Conditions (optional)</FieldLabel>
												{!condition ? (
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="h-7 text-xs"
														onClick={() => {
															const ranks = findRanksBetween({
																numberOfRanks: 1,
															});
															field.onChange({
																type: AutomationConditionBlockType.OR,
																kind: "block",
																rank: ranks[0],
																items: [],
															});
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
															field.onChange(undefined);
														}}
													>
														Remove all conditions
													</Button>
												)}
											</div>
											{condition && (
												<>
													<FieldDescription>
														Define conditions that must be met for this
														automation to run. Use JSONata expressions to
														construct a boolean value like{" "}
														<code>'Hello' in $.pub.values.title</code>.
													</FieldDescription>
													<ConditionBlock
														slug={"condition"}
														id={"root-block"}
													/>
												</>
											)}
											{fieldState.error && (
												<FieldError className="text-xs">
													{fieldState.error.message}
												</FieldError>
											)}
										</Field>
									)}
								/>
							)}

							{selectedTriggers.length > 0 && (
								<Controller
									control={form.control}
									name="action"
									render={({ field, fieldState }) => {
										return (
											<div className="space-y-2">
												<FieldLabel>Run</FieldLabel>
												<div className="space-y-2">
													{field.value?.action ? (
														<ActionConfigCard
															action={field.value.action}
															form={form}
															removeAction={() => {
																field.onChange({
																	action: undefined,
																	config: {},
																});
															}}
															isEditing={!!currentlyEditingAutomationId}
														/>
													) : null}
													{!field.value?.action && (
														<StagePanelActionCreator
															onAdd={(actionName) => {
																form.setValue("action", {
																	action: actionName,
																	config: {},
																});
															}}
															isSuperAdmin={user?.isSuperAdmin}
														>
															<Button
																data-testid="action-selector-select-trigger"
																className="h-auto justify-start border-dashed"
															>
																<div className="flex items-center gap-2 py-1">
																	<Plus
																		size={16}
																		className="text-neutral-500"
																	/>
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
											</div>
										);
									}}
								/>
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
							currentlyEditingAutomationId && "!justify-between",
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
	);
};

type ConfigCardProps = {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	onRemove: () => void;
	children?: React.ReactNode;
	showCollapseToggle?: boolean;
	defaultCollapsed?: boolean;
};

function ConfigCard(props: ConfigCardProps) {
	const [isCollapsed, setIsCollapsed] = useState(
		props.defaultCollapsed ?? false,
	);
	const hasContent = !!props.children;
	const Icon = props.icon;

	return (
		<Collapsible
			open={!isCollapsed}
			onOpenChange={(open) => setIsCollapsed(!open)}
			defaultOpen={!props.defaultCollapsed}
		>
			<Item variant="outline" className="bg-neutral-50">
				{/* <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"> */}
				<ItemHeader>
					{props.showCollapseToggle && hasContent && (
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0"
							>
								<span className="sr-only">
									{isCollapsed ? "Expand" : "Collapse"}
								</span>
								<ChevronRight
									size={14}
									className={cn(
										"transition-transform duration-200",
										isCollapsed ? "rotate-90" : "rotate-0",
									)}
								/>
							</Button>
						</CollapsibleTrigger>
					)}
					<Icon className="h-4 w-4 flex-shrink-0 text-neutral-600" />
					<span className="flex-1 font-medium text-neutral-900 text-sm">
						{props.title}
					</span>
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

				<CollapsibleContent className="pt-2 will-change-auto">
					{hasContent && <ItemContent>{props.children}</ItemContent>}
				</CollapsibleContent>
			</Item>
		</Collapsible>
	);
}

function TriggerConfigCard(props: {
	trigger: Trigger;
	form: UseFormReturn<CreateAutomationsSchema>;
	idx: number;
	community: Communities;
	removeTrigger: () => void;
	currentlyEditingAutomationId: AutomationsId | undefined;
	stageAutomations: AutoReturnType<typeof getStageAutomations>["execute"];
	isEditing: boolean;
}) {
	const trigger = getTriggerByName(props.trigger.event);
	const TriggerForm = useMemo(() => {
		if (!isTriggerWithConfig(props.trigger.event)) {
			return null;
		}

		return getTriggerConfigForm(props.trigger.event);
	}, [props.trigger.event]);

	const hasConfig =
		isSequentialAutomationEvent(props.trigger.event) ||
		(trigger.config && TriggerForm);

	return (
		<ConfigCard
			icon={trigger.display.icon}
			title={humanReadableEventBase(props.trigger.event, props.community)}
			onRemove={props.removeTrigger}
			showCollapseToggle={hasConfig}
			defaultCollapsed={props.isEditing}
		>
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

			{trigger.config && TriggerForm && (
				<TriggerForm form={props.form} idx={props.idx} />
			)}
		</ConfigCard>
	);
}

function ActionConfigCard(props: {
	action: Action;
	form: UseFormReturn<CreateAutomationsSchema>;
	removeAction: () => void;
	isEditing: boolean;
}) {
	const actionDef = actions[props.action];
	const ActionFormComponent = useMemo(() => {
		return getActionFormComponent(props.action);
	}, [props.action]);

	return (
		<ConfigCard
			icon={actionDef.icon}
			title={actionDef.name}
			onRemove={props.removeAction}
			showCollapseToggle={true}
			defaultCollapsed={props.isEditing}
		>
			{ActionFormComponent && (
				<Controller
					control={props.form.control}
					name="action.config"
					render={({ fieldState }) => {
						return (
							<>
								<ActionFormContext.Provider
									value={{
										action: actionDef,
										schema: actionDef.config.schema,
										path: "action.config",
										form: props.form as UseFormReturn<any> as UseFormReturn<FieldValues>,
										defaultFields: [],
										context: {
											type: "automation",
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
							</>
						);
					}}
				/>
			)}
		</ConfigCard>
	);
}
