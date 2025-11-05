"use client";

import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ActionInstances, AutomationsId, CommunitiesId, StagesId } from "db/public";
import {
	Action,
	actionInstancesIdSchema,
	AutomationConditionBlockType,
	AutomationConditionType,
	Event,
} from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Plus } from "ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { FormSubmitButton } from "ui/submit-button";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import type { ConditionBlockFormValue } from "./ConditionBlock";
import type { Automation, AutomationConfig, AutomationForEvent } from "~/actions/_lib/automations";
import type { getAutomation, getStageActions } from "~/lib/db/queries";
import type { AutoReturnType } from "~/lib/types";
import { ActionFormContext } from "~/actions/_lib/ActionForm";
import { actions, automations, getAutomationByName, humanReadableEventBase } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { findRanksBetween } from "~/lib/rank";
import { didSucceed, isClientException, useServerAction } from "~/lib/serverActions";
import { addOrUpdateAutomation, deleteAutomation } from "../../../actions";
import { ConditionsBuilder } from "./ConditionsBuilder";

type Props = {
	stageId: StagesId;
	actionInstances: AutoReturnType<typeof getStageActions>["execute"];
	communityId: CommunitiesId;
	automations: AutoReturnType<typeof getAutomation>["execute"];
};

const ActionSelector = ({
	fieldProps,
	actionInstances,
	label,
	placeholder,
	disabledActionId,
	dataTestIdPrefix,
}: {
	fieldProps: Omit<
		ControllerRenderProps<CreateAutomationsSchema, "sourceActionInstanceId">,
		"name"
	>;
	actionInstances: AutoReturnType<typeof getStageActions>["execute"];
	label: string;
	placeholder: string;
	disabledActionId?: string;
	dataTestIdPrefix?: string;
}) => {
	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>
			<Select
				onValueChange={fieldProps.onChange}
				defaultValue={fieldProps.value}
				value={fieldProps.value}
			>
				<SelectTrigger data-testid={`${dataTestIdPrefix}-select-trigger`}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{actionInstances.map((instance) => {
						const action = actions[instance.action];
						const isDisabled = instance.id === disabledActionId;

						return (
							<SelectItem
								key={instance.id}
								value={instance.id}
								className="hover:bg-gray-100"
								disabled={isDisabled}
								data-testid={`${dataTestIdPrefix}-select-item-${instance.name}`}
							>
								<div className="flex flex-row items-center gap-x-2">
									<action.icon size="12" />
									<span>{instance.name}</span>
									{isDisabled && (
										<span className="text-xs text-gray-400">
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
				])
			)
			.min(1),
	})
);

const baseSchema = z.discriminatedUnion("event", [
	z.object({
		event: z.literal(Event.pubEnteredStage),
		actionInstanceId: actionInstancesIdSchema,
		condition: conditionBlockSchema.optional(),
	}),
	z.object({
		event: z.literal(Event.pubLeftStage),
		actionInstanceId: actionInstancesIdSchema,
		condition: conditionBlockSchema.optional(),
	}),
	z.object({
		event: z.literal(Event.actionSucceeded),
		actionInstanceId: actionInstancesIdSchema,
		sourceActionInstanceId: actionInstancesIdSchema,
		condition: conditionBlockSchema.optional(),
	}),
	z.object({
		event: z.literal(Event.actionFailed),
		actionInstanceId: actionInstancesIdSchema,
		sourceActionInstanceId: actionInstancesIdSchema,
		condition: conditionBlockSchema.optional(),
	}),
	z.object({
		event: z.literal(Event.webhook),
		actionInstanceId: actionInstancesIdSchema,
		actionConfig: z.object({}),
		condition: conditionBlockSchema.optional(),
	}),
	...Object.values(automations)
		.filter(
			(
				automation
			): automation is Exclude<
				Automation,
				{
					event:
						| Event.pubEnteredStage
						| Event.pubLeftStage
						| Event.actionSucceeded
						| Event.actionFailed
						| Event.webhook;
				}
			> =>
				![
					Event.pubEnteredStage,
					Event.pubLeftStage,
					Event.actionSucceeded,
					Event.actionFailed,
					Event.webhook,
				].includes(automation.event)
		)
		.map((automation) =>
			z.object({
				event: z.literal(automation.event),
				actionInstanceId: actionInstancesIdSchema,
				automationConfig: automation.additionalConfig
					? automation.additionalConfig
					: z.null().optional(),
				condition: conditionBlockSchema.optional(),
			})
		),
]);

const refineSchema = <T extends z.ZodTypeAny>(schema: T) => {
	return schema.superRefine((data, ctx) => {
		if (data.event !== Event.actionSucceeded && data.event !== Event.actionFailed) {
			return;
		}

		if (data.sourceActionInstanceId === data.actionInstanceId) {
			ctx.addIssue({
				path: ["sourceActionInstanceId"],
				code: z.ZodIssueCode.custom,
				message: "Automations may not trigger actions in a loop",
			});
		}
	});
};

export type CreateAutomationsSchema = z.infer<typeof baseSchema> & {
	actionConfig: Record<string, unknown> | null;
};

export const StagePanelAutomationForm = (props: Props) => {
	const [currentlyEditingAutomationId, setCurrentlyEditingAutomationId] =
		useQueryState("automation-id");
	const runUpsertAutomation = useServerAction(addOrUpdateAutomation);
	const [isOpen, setIsOpen] = useState(false);

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
				setSelectedActionInstance(null);
				setSelectedEvent(null);
				form.reset();
				return;
			}

			form.setError("root", { message: result.error });
		},
		[
			currentlyEditingAutomationId,
			props.stageId,
			runUpsertAutomation,
			setCurrentlyEditingAutomationId,
		]
	);

	// we need to track these separaetly instead of reading them from the form bc we need these for the schema
	const [selectedActionInstance, setSelectedActionInstance] = useState<
		(typeof props.actionInstances)[number] | null
	>(null);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	const actionInstance = useMemo(() => {
		if (!selectedActionInstance) {
			return null;
		}
		const actionInstance = props.actionInstances.find(
			(action) => action.id === selectedActionInstance.id
		);

		if (!actionInstance) {
			return null;
		}

		return {
			...actionInstance,
			action: actions[actionInstance.action],
		};
	}, [selectedActionInstance, props.actionInstances]);

	const actionSchema = useMemo(() => {
		if (!selectedActionInstance) {
			return z.object({});
		}

		if (!actionInstance) {
			return z.object({});
		}

		const actionSchema = actionInstance.action.config.schema;

		const schemaWithPartialDefaults = (actionSchema as z.ZodObject<any>).partial(
			(actionInstance.defaultedActionConfigKeys ?? []).reduce(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{} as Record<string, true>
			)
		);

		return schemaWithPartialDefaults;
	}, [selectedActionInstance, actionInstance]);

	const schema = useMemo(() => {
		if (!selectedActionInstance) {
			return refineSchema(baseSchema);
		}
		const actionInstance = props.actionInstances.find(
			(action) => action.id === selectedActionInstance.id
		);
		if (!actionInstance) {
			logger.error({ msg: "Action not found", selectedActionInstance });
			return refineSchema(baseSchema);
		}

		if (selectedEvent !== Event.webhook) {
			return refineSchema(baseSchema);
		}

		const schemaWithAction = baseSchema.and(
			z.object({
				actionConfig: actionSchema,
			})
		);

		return refineSchema(schemaWithAction);
	}, [selectedActionInstance, props.actionInstances, actionSchema, selectedEvent]);

	const currentAutomation = props.automations.find(
		(automation) => automation.id === currentlyEditingAutomationId
	);

	const form = useForm<CreateAutomationsSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			actionInstanceId: currentAutomation?.actionInstance.id,
			event: currentAutomation?.event,
			actionConfig: currentAutomation?.config?.actionConfig ?? {},
			condition: currentAutomation?.condition ?? undefined,
		},
	});

	const community = useCommunity();

	const selectedActionInstanceId = form.watch("actionInstanceId");

	const sourceActionInstanceId = form.watch("sourceActionInstanceId");

	// for action chaining events, filter out self-references
	const isActionChainingEvent =
		selectedEvent === Event.actionSucceeded || selectedEvent === Event.actionFailed;

	const { allowedEvents } = useMemo(() => {
		if (!selectedActionInstanceId && !selectedEvent)
			return { disallowedEvents: [], allowedEvents: Object.values(Event) };

		const disallowedEvents = props.automations
			.filter((automation) => {
				// for regular events, disallow if same action+event already exists
				if (
					automation.event !== Event.actionSucceeded &&
					automation.event !== Event.actionFailed
				) {
					return true;
				}

				// for action chaining events, allow multiple automations with different watched actions
				return (
					automation.actionInstance.id === selectedActionInstanceId &&
					automation.event === selectedEvent &&
					automation.sourceActionInstance?.id === sourceActionInstanceId
				);
			})
			.map((automation) => automation.event);

		const allowedEvents = Object.values(Event).filter(
			(event) => !disallowedEvents.includes(event)
		);

		return { disallowedEvents, allowedEvents };
	}, [selectedActionInstanceId, selectedEvent, props.automations, sourceActionInstanceId]);

	useEffect(() => {
		const actionInstance =
			props.actionInstances.find((action) => action.id === selectedActionInstanceId) ?? null;
		setSelectedActionInstance(actionInstance);
		if (actionInstance?.config && selectedEvent === Event.webhook) {
			form.reset({
				...form.getValues(),
				actionConfig: actionInstance.config,
			});
		}
	}, [props.actionInstances, selectedActionInstanceId, selectedEvent]);

	useEffect(() => {
		if (!currentAutomation) {
			return;
		}

		setIsOpen(true);
		const actionInstance =
			props.actionInstances.find(
				(action) => action.id === currentAutomation.actionInstance.id
			) ?? null;
		setSelectedActionInstance(actionInstance);
		setSelectedEvent(currentAutomation.event);

		form.reset({
			actionInstanceId: currentAutomation.actionInstance.id,
			event: currentAutomation.event,
			actionConfig: currentAutomation.config?.actionConfig ?? {},
			sourceActionInstanceId: currentAutomation.sourceActionInstance?.id,
			automationConfig: currentAutomation.config?.automationConfig ?? {},
			condition: currentAutomation.condition,
		} as CreateAutomationsSchema);
	}, [currentAutomation, props.actionInstances]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				form.reset();
				setSelectedActionInstance(null);
				setCurrentlyEditingAutomationId(null);
			}
			setIsOpen(open);
		},
		[form, setCurrentlyEditingAutomationId]
	);

	const runDeleteAutomation = useServerAction(deleteAutomation);
	const onDeleteClick = useCallback(async () => {
		if (!currentlyEditingAutomationId) {
			return;
		}

		const res = await runDeleteAutomation(
			currentlyEditingAutomationId as AutomationsId,
			props.stageId
		);
		if (didSucceed(res)) {
			setCurrentlyEditingAutomationId(null);
			setSelectedActionInstance(null);
			setSelectedEvent(null);
			form.reset();
			setIsOpen(false);
			toast({
				title: "Automation deleted successfully",
			});
		}
	}, [
		currentlyEditingAutomationId,
		props.stageId,
		runDeleteAutomation,
		setCurrentlyEditingAutomationId,
		setSelectedEvent,
	]);

	const formId = useId();

	const ActionFormComponent = useMemo(() => {
		if (!selectedActionInstance) {
			return null;
		}

		return getActionFormComponent(selectedActionInstance.action);
	}, [selectedActionInstance]);

	const isExistingAutomation = !!currentlyEditingAutomationId;

	const condition = form.watch("condition");

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary" data-testid="add-automation-button">
						Add automation
					</Button>
				</DialogTrigger>
				<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{isExistingAutomation ? "Edit automation" : "Add automation"}
						</DialogTitle>
						<DialogDescription>
							Set up an automation to run whenever a certain event is triggered.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
							id={formId}
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col gap-y-4"
						>
							<FormField
								control={form.control}
								name="event"
								render={({ field }) => {
									const automation = field.value
										? getAutomationByName(field.value)
										: null;
									return (
										<FormItem>
											<FormLabel>When</FormLabel>

											{field.value && automation ? (
												<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
													<automation.display.icon className="h-4 w-4 text-blue-600" />
													<span className="flex-1 text-sm font-medium text-blue-900">
														{humanReadableEventBase(
															field.value,
															community
														)}
													</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-6 text-xs"
														onClick={() => {
															field.onChange("event", null);
															setSelectedEvent(null);
															if (isActionChainingEvent) {
																form.setValue(
																	"sourceActionInstanceId",
																	"" as any
																);
															}
														}}
													>
														Change
													</Button>
												</div>
											) : allowedEvents.length > 0 ? (
												<Select
													onValueChange={(value) => {
														setSelectedEvent(value as Event);
														field.onChange(value);
													}}
													defaultValue={field.value}
													key={field.value}
												>
													<SelectTrigger
														data-testid={`event-select-trigger`}
														className="h-auto w-full flex-1 items-center justify-between gap-2 border-dashed"
													>
														<SelectValue>
															<div className="flex items-center gap-2 py-1">
																<Plus
																	size={16}
																	className="text-neutral-500"
																/>
																<span className="text-neutral-600">
																	Add event
																</span>
															</div>
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{allowedEvents.map((event) => {
															const automation =
																getAutomationByName(event);

															return (
																<SelectItem
																	key={event}
																	value={event}
																	className="hover:bg-gray-100"
																	data-testid={`event-select-item-${event}`}
																>
																	<automation.display.icon className="mr-2 inline h-4 w-4 text-xs" />
																	{humanReadableEventBase(
																		event,
																		community
																	)}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>
											) : (
												<p className="text-xs text-red-500">
													All events for this action have already been
													added.
												</p>
											)}
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							{/* Additional selector for watched action when using action chaining events */}
							{isActionChainingEvent && (
								<FormField
									control={form.control}
									name="sourceActionInstanceId"
									render={({ field }) => (
										<ActionSelector
											fieldProps={field}
											actionInstances={props.actionInstances}
											label="After"
											placeholder="Select action to watch"
											key={field.value}
											disabledActionId={selectedActionInstanceId}
											dataTestIdPrefix="watched-action"
										/>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="actionInstanceId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Run</FormLabel>
										{field.value && selectedActionInstance ? (
											<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
												{actions[selectedActionInstance.action].icon &&
													(() => {
														const Icon =
															actions[selectedActionInstance.action]
																.icon;
														return (
															<Icon className="h-4 w-4 text-emerald-600" />
														);
													})()}
												<span className="flex-1 text-sm font-medium text-emerald-900">
													{selectedActionInstance.name}
												</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-6 text-xs"
													onClick={() => {
														field.onChange(undefined);
														setSelectedActionInstance(null);
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
																	Add action
																</span>
															</div>
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{props.actionInstances.map((instance) => {
														const action = actions[instance.action];
														const isDisabled =
															instance.id ===
															selectedActionInstanceId;

														return (
															<SelectItem
																key={instance.id}
																value={instance.id}
																className="hover:bg-gray-100"
																disabled={isDisabled}
																data-testid={`action-selector-select-item-${instance.name}`}
															>
																<div className="flex flex-row items-center gap-x-2">
																	<action.icon size="12" />
																	<span>{instance.name}</span>
																	{isDisabled && (
																		<span className="text-xs text-gray-400">
																			(self-reference not
																			allowed)
																		</span>
																	)}
																</div>
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							{selectedActionInstance && selectedEvent === Event.webhook && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Action configuration</h4>
									<div className="rounded-md border bg-gray-50 p-3">
										{ActionFormComponent && (
											<ActionFormContext.Provider
												value={{
													action: actions[selectedActionInstance.action],
													schema: actionSchema,
													path: "actionConfig",
													form: form as UseFormReturn<any> as UseFormReturn<FieldValues>,
													defaultFields:
														selectedActionInstance.defaultedActionConfigKeys ??
														[],
													context: { type: "automation" },
												}}
											>
												<ActionFormComponent />
											</ActionFormContext.Provider>
										)}
									</div>
								</div>
							)}

							{selectedEvent && selectedActionInstance && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										{!condition && (
											<>
												<h4 className="text-sm font-medium">
													Conditions (optional)
												</h4>
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={() => {
														const ranks = findRanksBetween({
															numberOfRanks: 1,
														});
														form.setValue("condition", {
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
											</>
										)}
									</div>
									{condition && (
										<div className="space-y-2">
											<ConditionsBuilder slug="condition" />
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-7 text-xs text-neutral-500"
												onClick={() => {
													form.setValue("condition", undefined);
												}}
											>
												Remove all conditions
											</Button>
										</div>
									)}
								</div>
							)}
						</form>
						{form.formState.errors.root && (
							<p
								className={
									"text-[0.8rem] font-medium text-red-500 dark:text-red-900"
								}
							>
								{form.formState.errors.root.message}
							</p>
						)}
					</Form>
					<DialogFooter
						className={cn(
							"sticky -bottom-4 flex w-full items-center",
							currentlyEditingAutomationId && "!justify-between"
						)}
					>
						{currentlyEditingAutomationId && (
							<Button type="button" variant="destructive" onClick={onDeleteClick}>
								<Trash size="14" />
								Delete automation
							</Button>
						)}

						<FormSubmitButton
							form={formId}
							formState={form.formState}
							disabled={
								allowedEvents.length === 0 ||
								(isActionChainingEvent && !sourceActionInstanceId)
							}
							idleText="Save automation"
							pendingText="Saving automation..."
							successText="Automation saved"
							errorText="Error saving automation"
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
