"use client";

import type { ControllerRenderProps, FieldValue, UseFormReturn } from "react-hook-form";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type {
	Action,
	ActionInstances,
	ActionInstancesId,
	CommunitiesId,
	StagesId,
} from "db/public";
import { actionInstancesIdSchema, Event } from "db/public";
import { logger } from "logger";
import { ActionInstanceProvider } from "ui/actionInstances";
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

import type { RuleConfig, RuleForEvent, Rules } from "~/actions/_lib/rules";
import type { SequentialRuleEvent } from "~/actions/types";
import { actions, getRuleByName, humanReadableEventBase, rules } from "~/actions/api";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { addRule } from "../../../actions";

type Props = {
	stageId: StagesId;
	actionInstances: ActionInstances[];
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
	actionInstances: ActionInstances[];
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
						| Event.actionFailed;
				}
			> =>
				![
					Event.pubEnteredStage,
					Event.pubLeftStage,
					Event.actionSucceeded,
					Event.actionFailed,
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

	const onOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
	}, []);

	const [selectedActionInstance, setSelectedActionInstance] = useState<ActionInstances | null>(
		null
	);

	const schema = useMemo(() => {
		if (!selectedActionInstance) {
			return refineSchema(baseSchema);
		}
		const action = props.actionInstances.find(
			(action) => action.id === selectedActionInstance.id
		)?.action;
		if (!action) {
			logger.error({ msg: "Action not found", selectedActionInstance });
			return refineSchema(baseSchema);
		}
		const actionSchema = actions[action].config.schema;

		const schemaWithAction = baseSchema.and(
			z.object({
				actionConfig: actionSchema,
			})
		);

		return refineSchema(schemaWithAction);
	}, [selectedActionInstance]);

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

	useEffect(() => {
		setSelectedActionInstance(
			props.actionInstances.find((action) => action.id === selectedActionInstanceId) ?? null
		);
	}, [selectedActionInstanceId]);

	const sourceActionInstanceId = form.watch("sourceActionInstanceId");

	// for action chaining events, filter out self-references
	const isActionChainingEvent = event === Event.actionSucceeded || event === Event.actionFailed;

	const getDisallowedEvents = useCallback(() => {
		if (!selectedActionInstanceId) return [];

		return props.rules
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
	}, [props.rules, selectedActionInstanceId, event, form]);

	const disallowedEvents = getDisallowedEvents();
	const allowedEvents = Object.values(Event).filter((event) => !disallowedEvents.includes(event));

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

							{selectedActionInstance && (
								<div className="mt-4 space-y-2">
									<h4 className="text-sm font-medium">
										With the following config:
									</h4>
									<div className="rounded-md border bg-gray-50 p-2">
										<AutoFormObject
											form={form}
											path={["actionConfig"]}
											name="actionConfig"
											schema={
												actions[selectedActionInstance.action].config.schema
											}
										/>
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
