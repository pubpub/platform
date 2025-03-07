"use client";

import type { ControllerRenderProps, FieldValue, UseFormReturn } from "react-hook-form";

import { useCallback, useState } from "react";
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
import type { ReferentialRuleEvent } from "~/actions/types";
import { actions, getRuleByName, humanReadableEvent, rules } from "~/actions/api";
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
		watchedAction?: ActionInstances;
		config?: RuleConfig<RuleForEvent<Event>> | null;
	}[];
};

// Action selector component to be reused
const ActionSelector = ({
	fieldProps,
	actionInstances,
	label,
	placeholder,
	disabledActionId,
}: {
	fieldProps: Omit<ControllerRenderProps<CreateRuleSchema, "watchedActionInstanceId">, "name">;
	actionInstances: ActionInstances[];
	label: string;
	placeholder: string;
	disabledActionId?: string;
}) => {
	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>
			<Select
				onValueChange={fieldProps.onChange}
				defaultValue={fieldProps.value}
				value={fieldProps.value}
			>
				<SelectTrigger>
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

const schema = z
	.discriminatedUnion("event", [
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
			watchedActionInstanceId: actionInstancesIdSchema,
		}),
		z.object({
			event: z.literal(Event.actionFailed),
			actionInstanceId: actionInstancesIdSchema,
			watchedActionInstanceId: actionInstancesIdSchema,
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
					additionalConfiguration: rule.additionalConfig
						? rule.additionalConfig
						: z.null().optional(),
				})
			),
	])
	.superRefine((data, ctx) => {
		if (data.event !== Event.actionSucceeded && data.event !== Event.actionFailed) {
			return;
		}

		if (data.watchedActionInstanceId === data.actionInstanceId) {
			ctx.addIssue({
				path: ["watchedActionInstanceId"],
				code: z.ZodIssueCode.custom,
				message: "Rules may not trigger actions in a loop",
			});
		}
	});

export type CreateRuleSchema = z.infer<typeof schema>;

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

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			actionInstanceId: undefined,
			event: undefined,
		},
	});

	const event = form.watch("event");
	const selectedActionInstanceId = form.watch("actionInstanceId");
	const watchedActionInstanceId = form.watch("watchedActionInstanceId");

	// For action chaining events, filter out self-references
	const isActionChainingEvent = event === Event.actionSucceeded || event === Event.actionFailed;

	// Get disallowed events based on current configuration
	const getDisallowedEvents = useCallback(() => {
		if (!selectedActionInstanceId) return [];

		return props.rules
			.filter((rule) => {
				// For regular events, disallow if same action+event already exists
				if (rule.event !== Event.actionSucceeded && rule.event !== Event.actionFailed) {
					return rule.actionInstance.id === selectedActionInstanceId;
				}

				// For action chaining events, allow multiple rules with different watched actions
				return (
					rule.actionInstance.id === selectedActionInstanceId &&
					rule.event === event &&
					rule.watchedAction?.id === watchedActionInstanceId
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
					<Button variant="secondary">Add a rule</Button>
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
							className="flex flex-col gap-y-2"
						>
							<div>
								<FormField
									control={form.control}
									name="actionInstanceId"
									render={({ field }) => (
										<ActionSelector
											fieldProps={field}
											actionInstances={props.actionInstances}
											label="Run..."
											placeholder="Action"
										/>
									)}
								/>
								<FormField
									control={form.control}
									name="event"
									render={({ field }) => (
										<FormItem>
											<FormLabel>when...</FormLabel>

											{allowedEvents.length > 0 ? (
												<>
													<Select
														onValueChange={(value) => {
															// Reset watchedActionInstanceId when event changes
															// if (
															// 	value === Event.actionSucceeded ||
															// 	value === Event.actionFailed
															// ) {
															// 	form.setValue(
															// 		"watchedActionInstanceId",
															// 		undefined
															// 	);
															// }
															field.onChange(value);
														}}
														defaultValue={field.value}
														key={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder="Event">
																{field.value
																	? humanReadableEvent(
																			field.value
																		)
																	: "Event"}
															</SelectValue>
														</SelectTrigger>
														<SelectContent>
															{allowedEvents.map((event) => (
																<SelectItem
																	key={event}
																	value={event}
																	className="hover:bg-gray-100"
																>
																	{humanReadableEvent(event)}{" "}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</>
											) : (
												<p className="text-xs text-red-500">
													All events for this action have already been
													added.
												</p>
											)}
										</FormItem>
									)}
								/>

								{/* Additional selector for watched action when using action chaining events */}
								{isActionChainingEvent && (
									<FormField
										control={form.control}
										name="watchedActionInstanceId"
										render={({ field }) => (
											<ActionSelector
												fieldProps={field}
												actionInstances={props.actionInstances}
												label="after action..."
												placeholder="Select action to watch"
												key={field.value}
												disabledActionId={selectedActionInstanceId} // Prevent self-references
											/>
										)}
									/>
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
							</div>
							<DialogFooter>
								<Button
									type="submit"
									disabled={
										allowedEvents.length === 0 ||
										(isActionChainingEvent && !watchedActionInstanceId)
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
