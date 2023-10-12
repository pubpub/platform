"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GetPubResponseBody, SafeUser, SuggestedMembersQuery } from "@pubpub/sdk";
import { useFieldArray, useForm } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Form,
	FormDescription,
	FormItem,
	FormLabel,
	Icon,
	useToast,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { InstanceConfig, InstanceState } from "~/lib/instance";
import { EvaluatorInviteRow } from "./EvaluatorInviteRow";
import * as actions from "./actions";
import { EmailFormSchema } from "./types";
import React, { useCallback } from "react";

type Props = {
	evaluators: SafeUser[];
	instanceId: string;
	instanceState: InstanceState;
	pub: GetPubResponseBody;
	template?: InstanceConfig["template"];
};

export function EmailForm(props: Props) {
	const { toast } = useToast();
	const template = {
		subject: props.template?.subject ?? "You've been invited to review a submission on PubPub",
		message: props.template?.message ?? `Please reach out if you have any questions.`,
	};
	const form = useForm<z.infer<typeof EmailFormSchema>>({
		mode: "all",
		reValidateMode: "onChange",
		resolver: zodResolver(EmailFormSchema),
		defaultValues: {
			invites: props.evaluators.map((evaluator) => ({
				userId: evaluator.id,
				firstName: evaluator.firstName,
				lastName: evaluator.lastName,
				template: props.instanceState[evaluator.id]?.emailTemplate ?? template,
			})),
		},
	});
	const {
		fields: invites,
		remove,
		append,
		update,
	} = useFieldArray({
		control: form.control,
		name: "invites",
		keyName: "key",
	});

	const onSubmit = useCallback(
		async (values: z.infer<typeof EmailFormSchema>) => {
			const result = await actions.save(
				props.instanceId,
				props.pub.id,
				props.pub.values["unjournal:title"] as string,
				values.invites
			);
			if ("error" in result) {
				toast({
					title: "Error",
					description: result.error,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Success",
					description: "The invite form was sent successfully",
				});
			}
		},
		[toast]
	);

	const onSuggest = useCallback(
		async (index: number, query: SuggestedMembersQuery) => {
			const result = await actions.suggest(props.instanceId, query);
			if ("error" in result && typeof result.error === "string") {
				toast({
					title: "Error",
					description: result.error,
					variant: "destructive",
				});
			} else if (Array.isArray(result)) {
				if (result.length > 0) {
					const [user] = result;
					const invite = invites[index];
					update(index, {
						userId: user.id,
						firstName: user.firstName,
						lastName: user.lastName,
						template: invite.template,
					});
					form.trigger(`invites.${index}`);
					toast({
						title: "Success",
						description: "A user was suggested",
					});
				} else {
					toast({
						title: "No matches found",
						description:
							"A user was not found for the given email, first name, or last name",
					});
				}
			}
		},
		[invites, toast, update, form.trigger]
	);

	const onRemove = useCallback(
		async (index: number) => {
			try {
				const invite = invites[index];
				if ("userId" in invite) {
					await actions.remove(props.instanceId, props.pub.id, invite.userId);
				}
				remove(index);
				toast({
					title: "Success",
					description: "The evaluator was removed",
				});
			} catch (e) {
				toast({
					title: "Error",
					description: "The evaluator could not be removed",
					variant: "destructive",
				});
			}
		},
		[invites, toast]
	);

	const onAppend = useCallback(
		async (event: React.MouseEvent) => {
			event.preventDefault();
			append({
				email: "",
				firstName: "",
				lastName: "",
				template,
			});
		},
		[append]
	);

	const onBack = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		window.history.back();
	}, []);

	return (
		<Form {...form}>
			<Card>
				<CardHeader>
					<CardTitle>Invite Evaluators</CardTitle>
					<CardDescription>
						Use this form to invite evaluators to review "
						{props.pub.values["unjournal:title"] as string}".
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-row gap-4 mb-4">
						<FormItem className="flex-1">
							<FormLabel>Email Address</FormLabel>
							<FormDescription>
								The email of the evaluator you'd like to invite.
							</FormDescription>
						</FormItem>
						<FormItem className="flex-1">
							<FormLabel>First Name</FormLabel>
							<FormDescription>
								The first name of the evaluator you'd like to invite.
							</FormDescription>
						</FormItem>
						<FormItem className="flex-1">
							<FormLabel>Last Name</FormLabel>
							<FormDescription>
								The last name of the evaluator you'd like to invite.
							</FormDescription>
						</FormItem>
						<div className="shrink-0 basis-36"></div>
					</div>
					{invites.map((invite, index) => (
						<EvaluatorInviteRow
							key={invite.key}
							time={
								"userId" in invite
									? props.instanceState[invite.userId]?.emailScheduledTime
									: undefined
							}
							control={form.control}
							index={index}
							onRemove={onRemove}
							onSuggest={onSuggest}
						/>
					))}
					<Button variant="ghost" onClick={onAppend} className="color:red-500">
						<Icon.Plus className="h-4 w-4 mr-2" />
						Add Evaluator
					</Button>
				</CardContent>
				<CardFooter className={cn("flex justify-between")}>
					<Button variant="outline" onClick={onBack}>
						Go Back
					</Button>
					<Button onClick={form.handleSubmit(onSubmit)}>
						{form.formState.isSubmitting && (
							<Icon.Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						Save
					</Button>
				</CardFooter>
			</Card>
		</Form>
	);
}
