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
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type Action from "~/kysely/types/public/Action";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { actions, humanReadableEvent } from "~/actions/api";
import Event from "~/kysely/types/public/Event";
import { useServerAction } from "~/lib/serverActions";
import { addRule } from "../../actions";

type Props = {
	// onAdd: (event: Event, actionInstanceId: ActionInstancesId) => Promise<unknown>;
	actionInstances: ActionInstances[];
	communityId: string;
	rules: {
		id: string;
		event: Event;
		instanceName: string;
		action: Action;
		actionInstanceId: ActionInstancesId;
	}[];
};

const schema = z.object({
	event: z.nativeEnum(Event),
	actionInstanceId: z.string(),
	additionalConfiguration: z
		.object({
			duration: z.number(),
			interval: z.enum(["hour", "day", "week", "month"]),
		})
		.optional(),
});

export const StagePanelRuleCreator = (props: Props) => {
	// const runOnAdd = useServerAction(props.onAdd);
	const runAddRule = useServerAction(addRule);
	const [isOpen, setIsOpen] = useState(false);
	const onSubmit = useCallback(
		async ({ event, actionInstanceId }: z.infer<typeof schema>) => {
			setIsOpen(false);
			runAddRule(event, actionInstanceId as ActionInstancesId, props.communityId);
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
								{event === Event.pubInStageForDuration && (
									<FormField
										control={form.control}
										name="additionalConfiguration"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Additional Config</FormLabel>
												<div className="flex flex-row items-center gap-x-2">
													<Input
														type="number"
														onChange={(val) =>
															field.onChange({
																...field.value,
																duration: val.target.valueAsNumber,
															})
														}
														defaultValue={5}
													/>
													<Select
														onValueChange={(val) =>
															field.onChange({
																...field.value,
																interval: val,
															})
														}
														defaultValue={"day"}
													>
														<SelectTrigger>
															<SelectValue placeholder="days" />
														</SelectTrigger>
														<SelectContent>
															{["hour", "day", "week", "month"].map(
																(interval) => (
																	<SelectItem
																		key={interval}
																		value={interval}
																		className="hover:bg-gray-100"
																	>
																		{interval}
																		{"s "}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
												</div>
												<FormMessage />
											</FormItem>
										)}
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
