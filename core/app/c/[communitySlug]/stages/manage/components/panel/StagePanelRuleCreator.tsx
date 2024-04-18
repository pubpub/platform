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
import { Form, FormField, FormItem, FormLabel } from "ui/form";
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
};

const schema = z.object({
	event: z.nativeEnum(Event),
	actionInstanceId: z.string(),
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

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary">Add a rule</Button>
				</DialogTrigger>
				<DialogContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<DialogHeader>
								<DialogTitle>Add a rule</DialogTitle>
								<DialogDescription>
									Select an action and an event to trigger it from the list below.
								</DialogDescription>
							</DialogHeader>
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
												{props.actionInstances.map((instance) => (
													<SelectItem
														key={instance.id}
														value={instance.id}
													>
														{instance.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="event"
								render={({ field }) => (
									<FormItem>
										<FormLabel></FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Event" />
											</SelectTrigger>
											<SelectContent>
												{(Object.keys(Event) as Event[]).map((event) => (
													<SelectItem key={event} value={event}>
														{humanReadableEvent(event)}{" "}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button type="submit">Save rule</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};
