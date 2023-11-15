"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GetPubResponseBody } from "@pubpub/sdk";
import React, { useCallback } from "react";
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
import { EmailTemplate, Evaluator, InstanceConfig, isInvited, hasUser, isSaved } from "~/lib/types";
import { EvaluatorInviteFormSaveButton } from "./EvaluatorInviteFormSaveButton";
import { EvaluatorInviteFormSendButton } from "./EvaluatorInviteFormSendButton";
import { EvaluatorInviteRow } from "./EvaluatorInviteRow";
import * as actions from "./actions";
import { InviteFormEvaluator, InviteFormSchema } from "./types";

type Props = {
	evaluators: Evaluator[];
	instanceId: string;
	instanceConfig: InstanceConfig;
	pub: GetPubResponseBody;
};

const makeEvaluator = (template: EmailTemplate): InviteFormEvaluator => {
	return {
		email: "",
		firstName: "",
		lastName: "",
		emailTemplate: { ...template },
		selected: false,
		status: "unsaved",
	};
};

export function EvaluatorInviteForm(props: Props) {
	const { toast } = useToast();
	const form = useForm<InviteFormSchema>({
		mode: "all",
		reValidateMode: "onChange",
		resolver: zodResolver(InviteFormSchema),
		values: {
			evaluators: props.evaluators.map((evaluator) => ({
				...evaluator,
				selected: false,
			})),
		},
	});
	const {
		fields: evaluators,
		remove,
		append,
		update,
	} = useFieldArray({
		control: form.control,
		name: "evaluators",
		keyName: "key",
	});

	const onSubmit = useCallback(
		async (values: InviteFormSchema, send = false) => {
			const result = await actions.save(
				props.instanceId,
				props.pub.id,
				props.pub.values[props.instanceConfig.titleFieldSlug] as string,
				values.evaluators,
				send
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
		[toast, evaluators]
	);

	const onSuggest = useCallback(
		async (index: number, evaluator: InviteFormEvaluator) => {
			const result = await actions.suggest(props.instanceId, evaluator);
			if ("error" in result && typeof result.error === "string") {
				toast({
					title: "Error",
					description: result.error,
					variant: "destructive",
				});
			} else if (Array.isArray(result)) {
				if (result.length > 0) {
					const [user] = result.filter(
						(user) =>
							!evaluators.some(
								(evaluator) => hasUser(evaluator) && evaluator.userId === user.id
							)
					);
					if (user === undefined) {
						toast({
							title: "No unique matches",
							description: "All suggested users exist in the form.",
						});
					} else {
						const evaluator = evaluators[index];
						update(index, {
							...evaluator,
							userId: user.id,
							firstName: user.firstName,
							lastName: user.lastName ?? undefined,
							status: "unsaved-with-user",
						});
						form.trigger(`evaluators.${index}`);
						toast({
							title: "Success",
							description: "A user was suggested.",
						});
					}
				} else {
					toast({
						title: "No matches found",
						description:
							"A user was not found for the given email, first name, or last name.",
					});
				}
			}
		},
		[evaluators, toast, update, form.trigger]
	);

	const onRemove = useCallback(
		async (index: number) => {
			try {
				const evaluator = evaluators[index];
				remove(index);
				if (isSaved(evaluator)) {
					await actions.remove(props.instanceId, props.pub.id, evaluator.userId);
				}
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
		[evaluators, toast]
	);

	const onAppend = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			append(makeEvaluator(props.instanceConfig.emailTemplate));
		},
		[append, evaluators]
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
						{props.pub.values[props.instanceConfig.titleFieldSlug] as string}".
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-row gap-4 mb-4">
						<FormItem className="flex-0 w-4"></FormItem>
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
						<div className="shrink-0 basis-48"></div>
					</div>
					{evaluators.map((evaluator, index) => (
						<EvaluatorInviteRow
							key={evaluator.key}
							invitedAt={isInvited(evaluator) ? evaluator.invitedAt : undefined}
							control={form.control}
							readOnly={isInvited(evaluator)}
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
					<div>
						<Button variant="outline" onClick={onBack}>
							Go Back
						</Button>
					</div>
					<div className="flex gap-2 items-center">
						{form.formState.isSubmitting && (
							<Icon.Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						<EvaluatorInviteFormSendButton
							onClick={form.handleSubmit((values) => onSubmit(values, true))}
						/>
						<EvaluatorInviteFormSaveButton
							onClick={form.handleSubmit((values) => onSubmit(values))}
						/>
					</div>
				</CardFooter>
			</Card>
		</Form>
	);
}
