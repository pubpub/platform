"use client";

import React, { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import type { GetPubResponseBody, User } from "@pubpub/sdk";
import { IntegrationAvatar } from "@pubpub/sdk/react";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Form, FormDescription, FormItem, FormLabel } from "ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
import { Calendar, Loader2, Plus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { useToast } from "ui/use-toast";

import type { EmailTemplate, InstanceConfig } from "~/lib/types";
import { Evaluator, hasUser, isInvited, isSaved } from "~/lib/types";
import * as actions from "./actions";
import { EvaluatorInviteFormInviteButton } from "./EvaluatorInviteFormInviteButton";
import { EvaluatorInviteFormSaveButton } from "./EvaluatorInviteFormSaveButton";
import { EvaluatorInviteRow } from "./EvaluatorInviteRow";
import { InviteFormEvaluator, InviteFormSchema } from "./types";

type Props = {
	evaluators: Evaluator[];
	instanceId: string;
	instanceConfig: InstanceConfig;
	pub: GetPubResponseBody;
	user: User;
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
					description: send ? "Selected evaluators were invited." : "The form was saved.",
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

	const evaluationManager = props.pub.assignee ?? props.user;

	return (
		<Form {...form}>
			<Card>
				<CardHeader className="flex flex-row justify-between">
					<div>
						<CardTitle>Invite Evaluators</CardTitle>
						<CardDescription>
							Use this form to invite evaluators to review "
							{props.pub.values[props.instanceConfig.titleFieldSlug] as string}".
						</CardDescription>
					</div>
					<div>
						<div className="mb-4 flex flex-row items-center">
							<TooltipProvider>
								<Tooltip>
									<TooltipContent>
										<p className="max-w-[200px]">
											{props.pub.assignee
												? "The submission's evaluation manager"
												: "The submission's evaluation manager, unless assigned to another"}
										</p>
									</TooltipContent>
									<TooltipTrigger asChild>
										<span className="cursor-pointer border-b-2 border-dotted text-sm">
											Assigned to:
										</span>
									</TooltipTrigger>
								</Tooltip>
							</TooltipProvider>
							<HoverCard>
								<HoverCardTrigger asChild>
									<Button variant="link">
										{evaluationManager.firstName} {evaluationManager.lastName}
									</Button>
								</HoverCardTrigger>
								<HoverCardContent>
									<div className="flex justify-between space-x-4">
										<IntegrationAvatar
											firstName={evaluationManager.firstName}
											url={evaluationManager.avatar!}
										/>
										<div className="space-y-1">
											<h4 className="text-sm font-semibold">
												{evaluationManager.firstName}{" "}
												{evaluationManager.lastName}
											</h4>
											<div className="flex items-center pt-2">
												<Calendar className="mr-2 h-4 w-4 opacity-70" />{" "}
												<span className="text-muted-foreground text-xs">
													Joined{" "}
													{new Date(
														evaluationManager.createdAt
													).toLocaleDateString(undefined, {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</span>
											</div>
										</div>
									</div>
								</HoverCardContent>
							</HoverCard>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-row gap-4">
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
						<Plus className="mr-2 h-4 w-4" />
						Add Evaluator
					</Button>
				</CardContent>
				<CardFooter className="flex justify-between">
					<div>
						<Button variant="outline" onClick={onBack}>
							Go Back
						</Button>
					</div>
					<div className="flex items-center gap-2">
						{form.formState.isSubmitting && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						<EvaluatorInviteFormInviteButton
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
