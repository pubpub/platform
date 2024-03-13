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
import { useCallback, useEffect, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import * as actions from "./actions";
import { Community } from "@prisma/client";
import { useRouter } from "next/navigation";
import { MemberFormState } from "./AddMember";
import { memberInviteFormSchema } from "./memberInviteFormSchema";

export const MemberInviteForm = ({
	community,
	state,
	email,
}: {
	community: Community;
	state: MemberFormState;
	email?: string;
}) => {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
		defaultValues: {
			canAdmin: false,
			email: email,
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
			// we manually do this check instead of letting zod do it
			// bc otherwis we need to either dynamically change the schema
			// or pass the state to the schema/form
			if (!data.firstName || !data.lastName) {
				form.setError(!data.firstName ? "firstName" : "lastName", {
					type: "manual",
					message: `Please provide a ${!data.firstName ? "first" : "last"} name`,
				});
				return;
			}

			const { error } = await actions.createUserWithMembership({
				email: data.email,
				firstName: data.firstName!,
				lastName: data.lastName!,
				community,
				canAdmin: Boolean(data.canAdmin),
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
				description: "User successfully invited",
			});
			closeForm();

			return;
		}

		const result = await actions.addMember({
			user: state.user,
			canAdmin: data.canAdmin,
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
		// this is how we make the higher up server component fetch the user again
		router.replace(
			window.location.pathname + "?" + new URLSearchParams({ email }).toString(),
			{}
		);
	}, 500);

	// we only want to update the state when the user or email changes, which
	// is after the email check has been debounced AND the user has been fetched
	// from the higher up server component
	useEffect(() => {
		if (!state.error) {
			form.clearErrors("email");
			return;
		}

		form.setError("email", {
			type: "manual",
			message: state.error,
		});
	}, [state.error, state.state]);

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
									Enter the email address of the person you'd like to invite to
									the {community.name} community
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
						name="canAdmin"
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
									src={state.user.avatar ?? undefined}
									alt={`${state.user.firstName} ${state.user.lastName}`}
								/>
								<AvatarFallback>
									{state.user.firstName[0]}
									{state.user?.lastName?.[0] ?? ""}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-2">
								<span>
									{state.user.firstName} {state.user.lastName}
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
