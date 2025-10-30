"use client";

import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ActionInstances, CommunitiesId, RulesId, StagesId } from "db/public";
import { actionInstancesIdSchema, Event } from "db/public";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { FormSubmitButton } from "ui/submit-button";
import { cn } from "utils";

import type { RuleConfig, RuleForEvent, Rules } from "~/actions/_lib/rules";
import type { getStageActions } from "~/lib/db/queries";
import type { AutoReturnType } from "~/lib/types";
import { ActionFormContext } from "~/actions/_lib/ActionFormProvider";
import { actions, getRuleByName, humanReadableEventBase, rules } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { addOrUpdateRule, deleteRule } from "../../../actions";

type Props = {
	stageId: StagesId;
	actionInstances: AutoReturnType<typeof getStageActions>["execute"];
	communityId: CommunitiesId;
	rules: {
		id: RulesId;
		event: Event;
		actionInstance: ActionInstances;
		sourceAction?: ActionInstances;

		config?: RuleConfig<RuleForEvent<Event>> | null;
	}[];
};

const ActionSelector = ({
	fieldProps,
	actionInstances,
	label,
	placeholder,
	disabledActionId,
	dataTestIdPrefix,
}: {
	fieldProps: Omit<ControllerRenderProps<CreateRuleSchema, "sourceActionInstanceId">, "name">;
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

const baseSchema = z.discriminatedUnion("event", [
	z.object({
		event: z.literal(Event.pubEnteredStage),
		actionInstanceId: actionInstancesIdSchema,
	}),
	z.object({
		event: z.literal(Event.pubLeftStage),
		actionInstanceId: actionInstancesIdSchema,
	}),
	z.object({
		event: z.literal(Event.actionSucceeded),
		actionInstanceId: actionInstancesIdSchema,
		sourceActionInstanceId: actionInstancesIdSchema,
	}),
	z.object({
		event: z.literal(Event.actionFailed),
		actionInstanceId: actionInstancesIdSchema,
		sourceActionInstanceId: actionInstancesIdSchema,
	}),
	z.object({
		event: z.literal(Event.webhook),
		actionInstanceId: actionInstancesIdSchema,
		actionConfig: z.object({}),
	}),
	...Object.values(rules)
		.filter(
			(
				rule
			): rule is Exclude<
				Rules,
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
				].includes(rule.event)
		)
		.map((rule) =>
			z.object({
				event: z.literal(rule.event),
				actionInstanceId: actionInstancesIdSchema,
				ruleConfig: rule.additionalConfig ? rule.additionalConfig : z.null().optional(),
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
				message: "Rules may not trigger actions in a loop",
			});
		}
	});
};

export type CreateRuleSchema = z.infer<typeof baseSchema> & {
	actionConfig: Record<string, unknown> | null;
};

export const StagePanelAutomationForm = (props: Props) => {
	const [currentlyEditingRuleId, setCurrentlyEditingRuleId] = useQueryState("rule-id");
	const runUpsertRule = useServerAction(addOrUpdateRule);
	const [isOpen, setIsOpen] = useState(false);

	const onSubmit = useCallback(
		async (data: CreateRuleSchema) => {
			const result = await runUpsertRule({
				stageId: props.stageId,
				data,
				ruleId: currentlyEditingRuleId as RulesId | undefined,
			});
			if (!isClientException(result)) {
				setIsOpen(false);
				setCurrentlyEditingRuleId(null);
				setSelectedActionInstance(null);
				form.reset();
				return;
			}

			form.setError("root", { message: result.error });
		},
		[props.stageId, runUpsertRule]
	);

	const [selectedActionInstance, setSelectedActionInstance] = useState<
		(typeof props.actionInstances)[number] | null
	>(null);

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

		const schemaWithAction = baseSchema.and(
			z.object({
				actionConfig: actionSchema,
			})
		);

		return refineSchema(schemaWithAction);
	}, [selectedActionInstance, props.actionInstances, actionSchema]);

	const form = useForm<CreateRuleSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			actionInstanceId: undefined,
			event: undefined,
			actionConfig: null,
		},
	});

	const community = useCommunity();

	const event = form.watch("event");
	const selectedActionInstanceId = form.watch("actionInstanceId");

	const sourceActionInstanceId = form.watch("sourceActionInstanceId");

	// for action chaining events, filter out self-references
	const isActionChainingEvent = event === Event.actionSucceeded || event === Event.actionFailed;

	const { allowedEvents } = useMemo(() => {
		if (!selectedActionInstanceId && !event)
			return { disallowedEvents: [], allowedEvents: Object.values(Event) };

		const disallowedEvents = props.rules
			.filter((rule) => {
				// for regular events, disallow if same action+event already exists
				if (rule.event !== Event.actionSucceeded && rule.event !== Event.actionFailed) {
					return rule.actionInstance.id === selectedActionInstanceId;
				}

				// for action chaining events, allow multiple rules with different watched actions
				return (
					rule.actionInstance.id === selectedActionInstanceId &&
					rule.event === event &&
					rule.sourceAction?.id === sourceActionInstanceId
				);
			})
			.map((rule) => rule.event);

		const allowedEvents = Object.values(Event).filter(
			(event) => !disallowedEvents.includes(event)
		);

		return { disallowedEvents, allowedEvents };
	}, [selectedActionInstanceId, event, props.rules, sourceActionInstanceId]);

	useEffect(() => {
		const actionInstance =
			props.actionInstances.find((action) => action.id === selectedActionInstanceId) ?? null;
		setSelectedActionInstance(actionInstance);

		if (actionInstance?.config) {
			form.reset({
				...form.getValues(),
				actionConfig: actionInstance.config,
			});
		}
	}, [form, props.actionInstances, selectedActionInstanceId]);

	useEffect(() => {
		const currentRule = props.rules.find((rule) => rule.id === currentlyEditingRuleId);

		if (!currentRule) {
			return;
		}

		setIsOpen(true);
		const actionInstance =
			props.actionInstances.find((action) => action.id === currentRule.actionInstance.id) ??
			null;
		setSelectedActionInstance(actionInstance);

		form.reset({
			actionInstanceId: currentRule.actionInstance.id,
			event: currentRule.event,
			actionConfig: currentRule.config?.actionConfig,
			sourceActionInstanceId: currentRule.sourceAction?.id,
			ruleConfig: currentRule.config?.ruleConfig,
		} as CreateRuleSchema);
	}, [currentlyEditingRuleId, props.actionInstances, props.rules]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				form.reset();
				setSelectedActionInstance(null);
				setCurrentlyEditingRuleId(null);
			}
			setIsOpen(open);
		},
		[setSelectedActionInstance, setIsOpen]
	);

	const rule = getRuleByName(event);

	const runDeleteRule = useServerAction(deleteRule);
	const onDeleteClick = useCallback(async () => {
		if (!currentlyEditingRuleId) {
			return;
		}

		runDeleteRule(currentlyEditingRuleId as RulesId, props.stageId);
	}, [currentlyEditingRuleId, props.stageId, runDeleteRule]);

	const formId = useId();

	const ActionFormComponent = useMemo(() => {
		if (!selectedActionInstance) {
			return null;
		}

		return getActionFormComponent(selectedActionInstance.action);
	}, [selectedActionInstance]);

	const isExistingRule = !!currentlyEditingRuleId;

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary" data-testid="add-rule-button">
						Add automation
					</Button>
				</DialogTrigger>
				<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{isExistingRule ? "Edit automation" : "Add automation"}
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
								render={({ field }) => (
									<FormItem>
										<FormLabel>When...</FormLabel>

										{allowedEvents.length > 0 ? (
											<>
												<Select
													onValueChange={(value) => {
														field.onChange(value);
													}}
													defaultValue={field.value}
													key={field.value}
												>
													<SelectTrigger
														data-testid={`event-select-trigger`}
													>
														<SelectValue placeholder="Event">
															{field.value ? (
																<>
																	<rule.display.icon className="mr-2 inline h-4 w-4 text-xs" />
																	{humanReadableEventBase(
																		field.value,
																		community
																	)}
																</>
															) : (
																"Event"
															)}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{allowedEvents.map((event) => {
															const rule = getRuleByName(event);

															return (
																<SelectItem
																	key={event}
																	value={event}
																	className="hover:bg-gray-100"
																	data-testid={`event-select-item-${event}`}
																>
																	<rule.display.icon className="mr-2 inline h-4 w-4 text-xs" />
																	{humanReadableEventBase(
																		event,
																		community
																	)}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>
												<FormMessage />
											</>
										) : (
											<p className="text-xs text-red-500">
												All events for this action have already been added.
											</p>
										)}
									</FormItem>
								)}
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
											disabledActionId={selectedActionInstanceId} // Prevent self-references
											dataTestIdPrefix="watched-action"
										/>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="actionInstanceId"
								render={({ field }) => (
									<ActionSelector
										fieldProps={field}
										actionInstances={props.actionInstances}
										label="run..."
										placeholder="Action"
										dataTestIdPrefix="action-selector"
									/>
								)}
							/>

							{selectedActionInstance && event === Event.webhook && (
								<div className="mt-4 space-y-2">
									<h4 className="text-sm font-medium">
										With the following config:
									</h4>
									<div className="rounded-md border bg-gray-50 p-2">
										{ActionFormComponent && (
											<ActionFormContext.Provider
												value={{
													action: actions[selectedActionInstance.action],
													schema: actionSchema,
													path: "actionConfig",
													// slightly elobarate cast, slightly more typesafe
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
							currentlyEditingRuleId && "!justify-between"
						)}
					>
						{currentlyEditingRuleId && (
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
