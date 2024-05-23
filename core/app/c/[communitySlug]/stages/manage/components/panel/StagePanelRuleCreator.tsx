"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import type { Rules } from "~/actions/_lib/rules";
import type Action from "~/kysely/types/public/Action";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import { actions, getRuleByName, humanReadableEvent, rules } from "~/actions/api";
import Event from "~/kysely/types/public/Event";
import { useServerAction } from "~/lib/serverActions";
import AutoFormObject from "../../../../../../../../packages/ui/src/auto-form/fields/object";
import { addRule } from "../../actions";

type Props = {
	// onAdd: (event: Event, actionInstanceId: ActionInstancesId) => Promise<unknown>;
	actionInstances: ActionInstances[];
	communityId: CommunitiesId;
	rules: {
		id: string;
		event: Event;
		instanceName: string;
		action: Action;
		actionInstanceId: ActionInstancesId;
	}[];
};

const schema = z.discriminatedUnion("event", [
	z.object({
		event: z.literal(Event.pubEnteredStage),
		actionInstanceId: z.string().uuid(),
	}),
	z.object({
		event: z.literal(Event.pubLeftStage),
		actionInstanceId: z.string().uuid(),
	}),
	...Object.values(rules)
		.filter(
			(rule): rule is Exclude<Rules, { event: Event.pubEnteredStage | Event.pubLeftStage }> =>
				rule.event !== Event.pubEnteredStage && rule.event !== Event.pubLeftStage
		)
		.map((rule) =>
			z.object({
				event: z.literal(rule.event),
				actionInstanceId: z.string().uuid(),
				additionalConfiguration: rule.additionalConfig
					? rule.additionalConfig
					: z.null().optional(),
			})
		),
]);

export type CreateRuleSchema = z.infer<typeof schema>;

export const StagePanelRuleCreator = (props: Props) => {
	// const runOnAdd = useServerAction(props.onAdd);
	const runAddRule = useServerAction(addRule);
	const [isOpen, setIsOpen] = useState(false);
	const onSubmit = useCallback(
		async (data: CreateRuleSchema) => {
			setIsOpen(false);
			runAddRule({ data, communityId: props.communityId });
			// runOnAdd(event, actionInstanceId as ActionInstancesId);
		},
		[props.communityId] // [props.onAdd, runOnAdd]
	);

	const onOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
	}, []);

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const event = form.watch("event");

	const selectedAction = form.watch("actionInstanceId");

	const disallowedEvents = props.rules
		.filter((rule) => rule.actionInstanceId === selectedAction)
		.map((rule) => rule.event);
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
										<FormItem>
											<FormLabel></FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Action" />
												</SelectTrigger>
												<SelectContent>
													{props.actionInstances.map((instance) => {
														const action = actions[instance.action];

														return (
															<SelectItem
																key={instance.id}
																value={instance.id}
																className="hover:bg-gray-100"
															>
																<div className="flex flex-row items-center gap-x-2">
																	<action.icon size="12" />
																	<span>{instance.name}</span>
																</div>
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="event"
									render={({ field }) => (
										<FormItem>
											<FormLabel></FormLabel>

											{allowedEvents.length > 0 ? (
												<>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder="Event" />
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
										schema={rule.additionalConfig}
									/>
								)}
							</div>
							<DialogFooter>
								<Button type="submit" disabled={allowedEvents.length === 0}>
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
