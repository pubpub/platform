"use client";

import type { z } from "zod";

import { useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

import { MemberRole } from "db/public";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";

import type { MemberFormState } from "./AddMember";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";
import { memberInviteFormSchema } from "./memberInviteFormSchema";

export const MemberInviteForm = ({
	state,
	email,
	isSuperAdmin,
}: {
	state: MemberFormState;
	email?: string;
	isSuperAdmin?: boolean;
}) => {
	const community = useCommunity();

	const runCreateUserWithMembership = useServerAction(actions.createUserWithMembership);
	const runAddMember = useServerAction(actions.addMember);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
		defaultValues: {
			email: email,
			role: MemberRole.editor,
			isSuperAdmin: false,
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

			const result = await runCreateUserWithMembership({
				email: data.email,
				firstName: data.firstName!,
				lastName: data.lastName!,
				role: data.role,
				isSuperAdmin: data.isSuperAdmin,
			});

			if (didSucceed(result)) {
				toast({
					title: "Success",
					description: "User successfully invited",
				});
				closeForm();
			}

			return;
		}

		const result = await runAddMember({
			user: state.user,
			role: data.role,
		});

		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Member added successfully",
			});

			// navigate away from the add page to the normal member page
			closeForm();
		}
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

						{/* Makes it a bit easier to add people as super admins,*/}
						{isSuperAdmin && (
							<FormField
								control={form.control}
								name="isSuperAdmin"
								render={({ field }) => (
									<FormItem className="flex items-end gap-x-2">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel>Make user superadmin</FormLabel>
									</FormItem>
								)}
							/>
						)}
					</>
				)}
				{state.state !== "initial" && (
					<FormField
						control={form.control}
						name="role"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Role</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a role" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={MemberRole.admin}>Admin</SelectItem>
										<SelectItem value={MemberRole.editor}>Editor</SelectItem>
										<SelectItem value={MemberRole.contributor}>
											Contributor
										</SelectItem>
									</SelectContent>
								</Select>
								<FormDescription>
									Select the role for this user.
									<ul className="list-inside list-disc">
										<li> Admins can do anything.</li>
										<li>Editors are able to edit most things</li>
										<li>
											Contributors are only able to see forms and other public
											facing content that are linked to them
										</li>
									</ul>
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				{state.state === "user-found" && (
					<Card>
						<CardContent className="flex items-center gap-x-4 p-4">
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
