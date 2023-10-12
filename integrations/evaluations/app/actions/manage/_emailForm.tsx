"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GetPubResponseBody, SafeUser, SuggestedMembersQuery } from "@pubpub/sdk";
import { useTransition } from "react";
import { Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	Textarea,
	useToast,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { InstanceConfig, InstanceState } from "~/lib/instance";
import * as actions from "./actions";

const EvaluatorInviteBase = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	template: z.object({
		subject: z.string(),
		message: z.string(),
	}),
});

const EvaluatorInvite: z.ZodType<actions.EvaluatorInvite> = z.union([
	z
		.object({
			userId: z.string(),
		})
		.and(EvaluatorInviteBase),
	z
		.object({
			email: z.string().email("Invalid email address"),
		})
		.and(EvaluatorInviteBase),
]);

// TODO: generate fields using instance's configured PubType
const EmailFormSchema = z.object({
	invites: z.array(EvaluatorInvite),
});

type SuggestButtonProps = {
	index: number;
	query: SuggestedMembersQuery;
	disabled?: boolean;
	onClick: (key: number, query: SuggestedMembersQuery) => void;
};

const SuggestButton = (props: SuggestButtonProps) => {
	const disabled = props.disabled ?? false;
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				event.preventDefault();
				startTransition(() => props.onClick(props.index, props.query));
			}}
			disabled={pending || disabled}
		>
			{disabled ? (
				<Icon.Check className="h-4 w-4" />
			) : pending ? (
				<Icon.Loader2 className="h-4 w-4" />
			) : (
				<Icon.Wand2 className="h-4 w-4" />
			)}
		</Button>
	);
};

type EvaluatorInviteRowProps = {
	control: Control<any>;
	time: string | undefined;
	index: number;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

const EvaluatorInviteRow = (props: EvaluatorInviteRowProps) => {
	const invite = useWatch<z.infer<typeof EmailFormSchema>>({
		control: props.control,
		name: `invites.${props.index}`,
	});
	const inviteSent = Boolean(props.time && new Date(props.time) < new Date());
	const inviteIsForPubPubUser = typeof invite === "object" && "userId" in invite;

	return (
		<div className="flex flex-row gap-4 mb-4">
			<FormField
				name={`invites.${props.index}.email`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={
									inviteIsForPubPubUser
										? "(email hidden)"
										: props.index === 0
										? "e.g. stevie@example.org"
										: ""
								}
								{...field}
								disabled={inviteIsForPubPubUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`invites.${props.index}.firstName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Stevie" : ""}
								{...field}
								disabled={inviteIsForPubPubUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`invites.${props.index}.lastName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Admin" : ""}
								{...field}
								disabled={inviteIsForPubPubUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="shrink-0 basis-36">
				<SuggestButton
					index={props.index}
					disabled={inviteIsForPubPubUser}
					query={invite as SuggestedMembersQuery}
					onClick={() => props.onSuggest(props.index, invite as SuggestedMembersQuery)}
				/>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost">
							<Icon.Mail className="h-4 w-4" />
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Template</DialogTitle>
							{props.time &&
								(inviteSent ? (
									<DialogDescription>
										This email was sent at{" "}
										<strong className="font-medium">
											{new Date(props.time).toLocaleString()}
										</strong>
										, and can no longer be edited.
									</DialogDescription>
								) : (
									<DialogDescription>
										This email is scheduled to be sent at{" "}
										<strong className="font-medium">
											{new Date(props.time).toLocaleString()}
										</strong>
										.
									</DialogDescription>
								))}
						</DialogHeader>
						<div className="flex flex-col justify-between align-baseline gap-4">
							<FormField
								name={`invites.${props.index}.template.subject`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subject</FormLabel>
										<FormControl>
											<Input {...field} disabled={inviteSent} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name={`invites.${props.index}.template.message`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Message</FormLabel>
										<FormControl className="mt-[8px]">
											<Textarea
												{...field}
												required
												disabled={inviteSent}
												rows={8}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</DialogContent>
				</Dialog>
				<Button variant="ghost" onClick={() => props.onRemove(props.index)}>
					<Icon.X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

type Props = {
	evaluators: SafeUser[];
	instanceId: string;
	instanceState: InstanceState;
	submission: GetPubResponseBody;
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

	const onSubmit = async (values: z.infer<typeof EmailFormSchema>) => {
		const result = await actions.save(
			props.instanceId,
			props.submission.id,
			props.submission.values["unjournal:title"] as string,
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
	};

	const onSuggest = async (index: number, query: SuggestedMembersQuery) => {
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
	};

	const onRemove = async (index: number) => {
		try {
			const invite = invites[index];
			if ("userId" in invite) {
				await actions.remove(props.instanceId, props.submission.id, invite.userId);
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
	};

	return (
		<Form {...form}>
			<Card>
				<CardHeader>
					<CardTitle>Invite Evaluators</CardTitle>
					<CardDescription>
						Use this form to invite evaluators to review "
						{props.submission.values["unjournal:title"] as string}".
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
					<Button
						variant="ghost"
						onClick={(e) => {
							e.preventDefault();
							invites.length < 5 &&
								append({
									email: "",
									firstName: "",
									lastName: "",
									template,
								});
						}}
						className="color:red-500"
					>
						<Icon.Plus className="h-4 w-4 mr-2" />
						Add Evaluator
					</Button>
				</CardContent>
				<CardFooter className={cn("flex justify-between")}>
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							window.history.back();
						}}
					>
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
