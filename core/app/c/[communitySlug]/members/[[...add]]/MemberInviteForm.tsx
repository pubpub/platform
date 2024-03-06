"use client";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Checkbox } from "ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Loader2, Mail, UserPlus } from "ui/icon";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback, useEffect, useReducer, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import * as actions from "./actions";
import { Community } from "@prisma/client";
import { useSearchParams, useRouter } from "next/navigation";
import { SuggestedUser } from "~/lib/server";

const memberInviteFormSchema = z.object({
	email: z.string().email({
		message: "Please provide a valid email address",
	}),
	admin: z.boolean().default(false).optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

type FormState =
	| {
			state: "user-not-found" | "initial";
			data: null;
	  }
	| { state: "user-found"; data: { user: SuggestedUser } };

const formStateReducer = (
	state: FormState,
	{
		email,
		user,
		error,
	}: {
		email?: string;
		user?: SuggestedUser | false | null | "you" | "existing-member";
		error?: string;
	}
): FormState => {
	console.log({ email, user, error });
	switch (true) {
		case !email:
			return { state: "initial", data: null };

		case email && user === false:
			return { state: "initial", data: null };

		case email && user === null:
			return { state: "user-not-found", data: null };

		case Boolean(email) && typeof user === "string" && Boolean(error):
			toast({
				title: "Cannot add user",
				description: error,
				variant: "destructive",
			});
			return { state: "initial", data: null };

		case Boolean(error):
			toast({
				title: "Error",
				description: error,
				variant: "destructive",
			});
			return { state: "initial", data: null };

		case Boolean(email) && Boolean(user):
			return { state: "user-found", data: { user: user as SuggestedUser } };

		default:
			return { state: "initial", data: null };
	}
};

export const MemberInviteForm = ({ community }: { community: Community }) => {
	const [isPending, startTransition] = useTransition();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [state, dispatch] = useReducer(formStateReducer, {
		state: "initial",
		data: null,
	});

	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
		delayError: 200,
		mode: "onChange",
		defaultValues: {
			admin: false,
			email: searchParams?.get("email") ?? "",
			firstName: "",
			lastName: "",
		},
	});

	const closeForm = useCallback(
		() => router.push(window.location.pathname!.replace(/\/add.*/, "")),
		[]
	);

	async function onSubmit(data: z.infer<typeof memberInviteFormSchema>) {
		if (state.state === "initial") {
			return;
		}

		if (state.state === "user-not-found") {
			// TODO: send invite
			const { error } = await actions.inviteMember({
				email: data.email,
				firstName: data.firstName!,
				lastName: data.lastName!,
				community,
			});

			if (error) {
				toast({
					title: "Error",
					description: error,
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: "User invited successfully",
			});
			closeForm();

			return;
		}

		const result = await actions.addMember({
			user: state.data!.user,
			admin: data.admin,
			community,
		});

		if ("error" in result) {
			toast({
				title: "Error",
				description: `Failed to add member. ${result.error}`,
				variant: "destructive",
			});
			return;
		}

		toast({
			title: "Success",
			description: "Member added successfully",
		});

		// navigate away from the add page to the normal member page
		closeForm();
	}

	const debouncedEmailCheck = useDebouncedCallback(async (email: string) => {
		if (form.getFieldState("email").error) {
			console.log(email, " somehow invalid");
			dispatch({ email, user: undefined });
			return;
		}

		router.replace(
			window.location.pathname + "?" + new URLSearchParams({ email }).toString(),
			{}
		);

		const { user, error } = await actions.suggest(email, community);

		dispatch({ email, error, user });
	}, 500);

	/**
	 * Run the debounced email check on mount if email is provided through the query params
	 */
	useEffect(() => {
		const searchParamEmail = searchParams?.get("email");
		if (searchParamEmail) {
			debouncedEmailCheck(searchParamEmail);
		}
	}, []);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem aria-label="Email">
							<FormLabel>Email</FormLabel>
							<div className="flex items-center gap-x-2">
								<Input
									type="email"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										// call(e);
										startTransition(async () => {
											await debouncedEmailCheck(e.target.value);
										});
									}}
								/>
								{isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							</div>
							{state.state === "initial" ? (
								<FormDescription>
									First try typing the email address of the person you'd like to
									invite. If they're already a user, you can add them as a member
									immediately.
								</FormDescription>
							) : state.state === "user-not-found" ? (
								<FormDescription>
									This email is not yet associated with an account. You can still
									invite them to join this community.
								</FormDescription>
							) : null}

							<FormMessage />
						</FormItem>
					)}
				/>
				{state.state === "user-not-found" && (
					<>
						<FormField
							name="firstName"
							render={({ field }) => (
								<FormItem aria-label="First Name">
									<FormLabel>First Name</FormLabel>
									<Input {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="lastName"
							render={({ field }) => (
								<FormItem aria-label="Last Name">
									<FormLabel>Last Name</FormLabel>
									<Input {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
				{state.state !== "initial" && (
					<FormField
						control={form.control}
						name="admin"
						render={({ field }) => (
							<FormItem className="flex items-end gap-x-2">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel>Make user admin of this community</FormLabel>
							</FormItem>
						)}
					/>
				)}
				{state.state === "user-found" && (
					<Card>
						<CardContent className="flex gap-x-4 items-center p-4">
							<Avatar>
								<AvatarImage
									src={state.data.user.avatar ?? undefined}
									alt={`${state.data.user.firstName} ${state.data.user.lastName}`}
								/>
								<AvatarFallback>
									{state.data.user.firstName[0]}
									{state.data.user?.lastName?.[0] ?? ""}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-2">
								<span>
									{state.data.user.firstName} {state.data.user.lastName}
								</span>
								<span>{form.getValues().email}</span>
							</div>
						</CardContent>
					</Card>
				)}
				{state.state !== "initial" && (
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : state.state === "user-not-found" ? (
							<span className="flex items-center gap-x-2">
								<Mail size="16" /> Invite
							</span>
						) : (
							<span className="flex items-center gap-x-2">
								<UserPlus size="16" /> Add Member
							</span>
						)}
					</Button>
				)}
			</form>
		</Form>
	);
};
