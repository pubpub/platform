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
import { useEffect, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import * as actions from "./actions";
import { Community } from "@prisma/client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const memberInviteFormSchema = z.object({
	email: z.string().email(),
	admin: z.boolean().default(false).optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	user: z
		.object({
			id: z.string(),
			slug: z.string(),
			firstName: z.string(),
			lastName: z.string().nullable(),
			avatar: z.string().nullable(),
		})
		.or(z.literal(false))
		.optional(),
});

export const MemberInviteForm = ({ community }: { community: Community }) => {
	const [isPending, startTransition] = useTransition();
	const searchParams = useSearchParams();
	const router = useRouter();
	const path = usePathname();

	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
		defaultValues: {
			admin: false,
			user: undefined,
			email: searchParams?.get("email") ?? "",
		},
	});

	const user = form.watch("user");
	const email = form.watch("email");

	async function onSubmit(data: z.infer<typeof memberInviteFormSchema>) {
		// form submissions are autowrapped in transitions, so we don't need to wrap this in a startTransition

		const timer = new Promise((resolve) => setTimeout(resolve, 1000));
		if (!data.user) {
			// send invite
			return;
		}

		const result = actions.addMember({
			user: data.user,
			admin: data.admin,
			community,
		});

		await Promise.all([timer, result]);
		if ("error" in result) {
			toast({
				title: "Error",
				description: `Failed to add member. ${result.error}`,
			});
			return;
		}

		toast({
			title: "Success",
			description: "Member added successfully",
		});

		// navigate away from the add page to the normal member page
		router.push(path!.replace(/\/add.*/, ""));
	}

	const debouncedEmailCheck = useDebouncedCallback(async (email: string) => {
		startTransition(async () => {
			if (!email) {
				form.setValue("user", undefined);
				return;
			}
			// validate the email
			if (!memberInviteFormSchema.shape.email.safeParse(email).success) {
				form.setError("email", {
					message: "Please provide a valid email address",
				});
				form.setValue("user", undefined);
				return;
			}
			form.clearErrors("email");

			router.replace(path + "?" + new URLSearchParams({ email }).toString(), {});

			const { member, user, error } = await actions.suggest(email, community);

			if (typeof user === "string") {
				form.setValue("user", undefined);
				toast({
					title: "Cannot add user",
					description: error,
				});
				return;
			}

			if (error) {
				toast({
					title: "Error",
					description: "Failed to suggest user",
				});
				return;
			}

			if (user) {
				form.setValue("user", user);
				return;
			}

			if (member) {
				form.setValue("user", undefined);
				return;
			}

			form.setValue("user", false);
			return;
		});
	}, 500);

	/**
	 * Run the debounced email check on mount if email is provided through the query params
	 */
	useEffect(() => {
		if (email) {
			debouncedEmailCheck(email);
		}
	}, []);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="email"
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
										debouncedEmailCheck(e.target.value);
									}}
								/>
								{isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							</div>
							{user === undefined ? (
								<FormDescription>
									First try typing the email address of the person you'd like to
									invite. If they're already a user, you can add them as a member
									immediately.
								</FormDescription>
							) : user === false ? (
								<FormDescription>
									This email is not yet associated with an account. You can still
									invite them to join this community.
								</FormDescription>
							) : null}
							<FormMessage />
						</FormItem>
					)}
				/>
				{user === false && (
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
				{user !== undefined && (
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
				{user && (
					<Card>
						<CardContent className="flex gap-x-4 items-center p-4">
							<Avatar>
								<AvatarImage
									src={user.avatar ?? undefined}
									alt={`${user.firstName} ${user.lastName}`}
								/>
								<AvatarFallback>
									{user.firstName[0]}
									{user?.lastName?.[0] ?? ""}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-2">
								<span>
									{user.firstName} {user.lastName}
								</span>
								<span>{form.getValues().email}</span>
							</div>
						</CardContent>
					</Card>
				)}
				{user !== undefined && (
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : user === false ? (
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
