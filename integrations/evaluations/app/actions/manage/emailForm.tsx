"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardFooter,
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
import { manage } from "./actions";

type Props = {
	instanceId: string;
	pubId: string;
};

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	email: z.string().email("Enter a valid email address"),
	name: z.string().min(1, "Name is required"),
});

export function EmailForm(props: Props) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		// TODO: generate fields using instance's configured PubType
		resolver: zodResolver(schema),
		defaultValues: {
			email: "",
			name: "",
		},
	});
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);

	const onSubmit = async (values: z.infer<typeof schema>) => {
		const result = await manage(props.instanceId, props.pubId, values.email, values.name);
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
			form.reset();
		}
	};

	// Load the persisted values.
	const { reset } = form;
	useEffect(() => {
		// `keepDefaultValues` is set to true to prevent the form from
		// validating fields that were not filled during the previous session.
		reset(persistedValues, { keepDefaultValues: true });
	}, [reset]);

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
					<CardContent className={cn("flex flex-col column gap-4")}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email Address</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										The email of the evaluator you'd like to invite.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reviewer Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										The name of the evaluator you'd like to invite.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
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
