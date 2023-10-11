"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GetPubResponseBody, SafeUser, SuggestedMembersQuery } from "@pubpub/sdk";
import { useState, useTransition } from "react";
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
	DialogClose,
	DialogContent,
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
import { manage, suggest } from "./actions";

const InviteBase = z.object({
	firstName: z.string(),
	lastName: z.string(),
	template: z.object({
		subject: z.string(),
		message: z.string(),
	}),
});

const Invite = z.union([
	z
		.object({
			userId: z.string(),
		})
		.and(InviteBase),
	z
		.object({
			email: z.string(),
		})
		.and(InviteBase),
]);

type Invite = z.infer<typeof Invite>;

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	invites: z.array(Invite),
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

type EvaluatorInviteProps = {
	control: Control<any>;
	index: number;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

const EvaluatorInvite = (props: EvaluatorInviteProps) => {
	const [open, setOpen] = useState(false);

	const invite = useWatch<z.infer<typeof schema>>({
		control: props.control,
		name: `invites.${props.index}`,
	});

	const isSuggested = typeof invite === "object" && "userId" in invite;

	return (
		<div className="flex flex-row gap-4 items-end mb-4">
			<FormField
				name={`invites.${props.index}.email`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						{props.index === 0 && (
							<>
								<FormLabel>Email Address</FormLabel>
								<FormDescription>
									The email of the evaluator you'd like to invite.
								</FormDescription>
							</>
						)}
						<FormControl>
							<Input
								placeholder={
									isSuggested
										? "(email hidden)"
										: props.index === 0
										? "e.g. stevie@example.org"
										: ""
								}
								{...field}
								disabled={isSuggested}
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
						{props.index === 0 && (
							<>
								<FormLabel>First Name</FormLabel>
								<FormDescription>
									The first name of the evaluator you'd like to invite.
								</FormDescription>
							</>
						)}
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Stevie" : ""}
								{...field}
								disabled={isSuggested}
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
						{props.index === 0 && (
							<>
								<FormLabel>Last Name</FormLabel>
								<FormDescription>
									The last name of the evaluator you'd like to invite.
								</FormDescription>
							</>
						)}
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Admin" : ""}
								{...field}
								disabled={isSuggested}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<SuggestButton
				index={props.index}
				disabled={isSuggested}
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
					<div className="flex mb-3">
						<DialogTitle>Edit Template</DialogTitle>
						<DialogClose asChild>
							<button className="ml-auto" aria-label="Close">
								<Icon.X className="h-4 w-4" />
							</button>
						</DialogClose>
					</div>
					<div className="mb-3">
						<FormField
							name={`invites.${props.index}.template.subject`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Subject</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										This is the default subject line for the email. You can
										change it by entering text above.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="flex flex-col justify-between align-baseline">
						<FormLabel>Email Message</FormLabel>
						<FormField
							name={`invites.${props.index}.template.message`}
							render={({ field }) => (
								<FormItem>
									<FormControl className="mt-[8px]">
										<Textarea {...field} required />
									</FormControl>
									<FormDescription>
										Change the default email message by entering text.
									</FormDescription>
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
	);
};

type Props = {
	instanceId: string;
	submission: GetPubResponseBody;
	template?: {
		subject: string;
		message: string;
	};
	evaluators: SafeUser[];
	templates: {
		[userId: string]: {
			subject: string;
			message: string;
		};
	};
};

export function EmailForm(props: Props) {
	const { toast } = useToast();
	const template = {
		subject: props.template?.subject ?? "You've been invited to review a submission on PubPub",
		message: props.template?.message ?? `Please reach out if you have any questions.`,
	};
	const form = useForm<z.infer<typeof schema>>({
		mode: "all",
		reValidateMode: "onChange",
		resolver: zodResolver(schema),
		defaultValues: {
			invites: props.evaluators.map((evaluator) => ({
				userId: evaluator.id,
				firstName: evaluator.firstName,
				lastName: evaluator.lastName,
				template: props.templates[evaluator.id] ?? template,
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

	const onSubmit = async (values: z.infer<typeof schema>) => {
		const result = await manage(
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
				description: "The email was sent successfully",
			});
			form.reset({ invites: result });
		}
	};

	const onSuggest = async (index: number, query: SuggestedMembersQuery) => {
		const result = await suggest(props.instanceId, query);
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
					{invites.map((invite, index) => (
						<EvaluatorInvite
							key={invite.key}
							control={form.control}
							index={index}
							onRemove={remove}
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
						Invite
					</Button>
				</CardFooter>
			</Card>
		</Form>
	);
}
