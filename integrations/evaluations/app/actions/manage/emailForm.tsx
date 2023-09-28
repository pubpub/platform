"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { useEffect, useTransition } from "react";
import { Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	useLocalStorage,
	useToast,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { suggest, manage } from "./actions";

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
};

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	invites: z.array(
		z.object({
			id: z.string().optional(),
			email: z.string().email("Enter a valid email address"),
			firstName: z.string().min(1, "First name is required"),
			lastName: z.string().min(1, "Last name is required"),
		})
	),
});

type SuggestButtonProps = {
	index: number;
	query: SuggestedMembersQuery & { id?: string };
	onClick: (key: number, query: SuggestedMembersQuery) => void;
};

const SuggestButton = (props: SuggestButtonProps) => {
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				event.preventDefault();
				startTransition(() => props.onClick(props.index, props.query));
			}}
			disabled={pending || props.query.id !== undefined}
		>
			{props.query.id ? (
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
	item: SuggestedMembersQuery & { key: string };
	index: number;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

const EvaluatorInvite = (props: EvaluatorInviteProps) => {
	const value = useWatch<z.infer<typeof schema>>({
		control: props.control,
		name: `invites.${props.index}`,
	});
	return (
		<div key={props.item.key} className="flex flex-row gap-4 items-end mb-4">
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
								placeholder={props.index === 0 ? "e.g. stevie@example.org" : ""}
								{...field}
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
							<Input placeholder={props.index === 0 ? "Stevie" : ""} {...field} />
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
							<Input placeholder={props.index === 0 ? "Admin" : ""} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<SuggestButton
				index={props.index}
				query={value as SuggestedMembersQuery}
				onClick={() => props.onSuggest(props.index, value as SuggestedMembersQuery)}
			/>
			<Button variant="ghost" onClick={() => props.onRemove(props.index)}>
				<Icon.X className="h-4 w-4" />
			</Button>
		</div>
	);
};

export function EmailForm(props: Props) {
	const { toast } = useToast();
	const [suggestPending, startTransition] = useTransition();
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		// TODO: generate fields using instance's configured PubType
		resolver: zodResolver(schema),
		// defaultValues: {
		// 	invites: [
		// 		{ email: "", firstName: "", lastName: "" },
		// 		{ email: "", firstName: "", lastName: "" },
		// 	],
		// },
	});
	const {
		fields: invites,
		update,
		remove,
		append,
	} = useFieldArray({
		control: form.control,
		name: "invites",
		keyName: "key",
	});
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);

	const onSubmit = async (values: z.infer<typeof schema>) => {
		const result = await manage(
			props.instanceId,
			props.pub.id,
			props.pub.values["unjournal:title"] as string,
			values.invites[0].email,
			values.invites[0].firstName,
			values.invites[0].lastName
		);
		if ("error" in result && typeof result.error === "string") {
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
		}
	};

	const onSuggest = async (index: number, query: SuggestedMembersQuery) => {
		console.log(query);
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
				update(index, { ...values.invites[index], ...user });
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

	// Load the persisted values.
	// const { reset } = form;
	// useEffect(() => {
	// 	// `keepDefaultValues` is set to true to prevent the form from
	// 	// validating fields that were not filled during the previous session.
	// 	reset(persistedValues, { keepDefaultValues: true });
	// }, [reset]);

	// Persist form values to local storage. This operation is debounced by
	// the timeout passed to <LocalStorageProvider>.
	const values = form.watch();
	useEffect(() => {
		persist(values);
	}, [values]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>Invite Evaluators</CardTitle>
						<CardDescription>
							Use this form to invite evaluators to review "
							{props.pub.values["unjournal:title"] as string}".
						</CardDescription>
					</CardHeader>
					<CardContent>
						{invites.map((item, index) => (
							<EvaluatorInvite
								key={item.key}
								item={item}
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
									append({ email: "", firstName: "", lastName: "" });
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
						<Button type="submit" disabled={!form.formState.isValid}>
							{form.formState.isSubmitting && (
								<Icon.Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Invite
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
