"use client";

import type { ControllerRenderProps } from "react-hook-form";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ActionInstances, CommunitiesId, StagesId } from "db/public";
import { actionInstancesIdSchema, Event } from "db/public";
import { logger } from "logger";
import { AutoFormObject } from "ui/auto-form";
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
import { TokenProvider } from "ui/tokens";

import type { RuleConfig, RuleForEvent, Rules } from "~/actions/_lib/rules";
import type { getStageActions } from "~/lib/db/queries";
import type { AutoReturnType } from "~/lib/types";
import { actions, getRuleByName, humanReadableEventBase, rules } from "~/actions/api";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { addRule } from "../../../actions";

type Props = {
	stageId: StagesId;
	actionInstances: AutoReturnType<typeof getStageActions>["execute"];
	communityId: CommunitiesId;
	rules: {
		id: string;
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

export const StagePanelRuleCreator = (props: Props) => {
	const runAddRule = useServerAction(addRule);
	const [isOpen, setIsOpen] = useState(false);
	const onSubmit = useCallback(
		async (data: CreateRuleSchema) => {
			const result = await runAddRule({ stageId: props.stageId, data });
			if (!isClientException(result)) {
				setIsOpen(false);
			}
		},
		[props.stageId, runAddRule]
	);

	const [selectedActionInstance, setSelectedActionInstance] = useState<ActionInstances | null>(
		null
	);

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
	}, [selectedActionInstance, props.actionInstances, actionInstance]);

	const selectedActionTokens = useMemo(() => {
		if (!actionInstance) {
			return {};
		}

		if (!actionInstance.action.tokens) {
			return {};
		}

		return Object.fromEntries(
			Object.entries(actionInstance.action.tokens).map(([key, value]) => [
				`actionConfig.${key}`,
				value,
			])
		);
	}, [actionInstance]);

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
	}, [selectedActionInstance, actionSchema]);

	const form = useForm<CreateRuleSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			actionInstanceId: undefined,
			event: undefined,
			actionConfig: null,
		},
	});

	const onOpenChange = useCallback(
		(open: boolean) => {
			form.reset();
			setSelectedActionInstance(null);
			setIsOpen(open);
		},
		[form, setSelectedActionInstance, setIsOpen]
	);

	const community = useCommunity();

	const event = form.watch("event");
	const selectedActionInstanceId = form.watch("actionInstanceId");

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
	}, [selectedActionInstanceId]);

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
	}, [props.rules, selectedActionInstanceId, event, form]);

	const rule = getRuleByName(event);

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary" data-testid="add-rule-button">
						Add a rule
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add a rule</DialogTitle>
						<DialogDescription>
							Select an action and an event to trigger it from the list below.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
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
										<TokenProvider tokens={selectedActionTokens}>
											<AutoFormObject
												key={selectedActionInstance.id}
												// @ts-expect-error FIXME: this fails because AutoFormObject
												// expects the schema for `form` to be the same as the one for
												// `schema`.
												// Could be fixed by changing AutoFormObject to look at the schema of `form` at `path` for
												// the schema at `schema`.
												form={form}
												path={["actionConfig"]}
												name="actionConfig"
												schema={actionSchema}
												fieldConfig={
													actionInstance?.action.config.fieldConfig
												}
												dependencies={
													actionInstance?.action.config.dependencies
												}
											/>
										</TokenProvider>
									</div>
								</div>
							)}

							{rule?.additionalConfig && (
								<AutoFormObject
									// @ts-expect-error FIXME: this fails because AutoFormObject
									// expects the schema for `form` to be the same as the one for
									// `schema`.
									// Could be fixed by changing AutoFormObject to look at the schema of `form` at `path` for
									// the schema at `schema`.
									form={form}
									path={["additionalConfiguration"]}
									name="additionalConfiguration"
									// @ts-expect-error FIXME: rule.additionalConfig is a typed as a ZodType, not a ZodObject, even though it is.
									schema={rule.additionalConfig}
								/>
							)}
							<DialogFooter>
								<Button
									type="submit"
									disabled={
										allowedEvents.length === 0 ||
										(isActionChainingEvent && !sourceActionInstanceId)
									}
								>
									Save rule
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};
