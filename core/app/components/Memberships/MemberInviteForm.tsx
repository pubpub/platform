"use client"

import type { z } from "zod"
import type { DialogProps } from "./types"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { skipToken } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { MemberRole } from "db/public"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { Card, CardContent } from "ui/card"
import { Checkbox } from "ui/checkbox"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form"
import { Loader2, Mail, UserPlus } from "ui/icon"
import { Input } from "ui/input"
import { MultiSelect } from "ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { toast } from "ui/use-toast"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { client } from "~/lib/api"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { descriptions } from "./constants"
import { memberInviteFormSchema } from "./memberInviteFormSchema"

export const MemberInviteForm = ({
	existingMembers,
	isSuperAdmin,
	addMember,
	addUserMember,
	closeForm,
	membershipType,
	availableForms,
}: DialogProps & {
	closeForm: () => void
}) => {
	const community = useCommunity()

	const runCreateUserWithMembership = useServerAction(addUserMember)
	const runAddMember = useServerAction(addMember)

	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
		defaultValues: {
			role: MemberRole.editor,
			isSuperAdmin: false,
		},
		mode: "onChange",
	})
	const email = form.watch("email")
	const emailState = form.getFieldState("email", form.formState)
	const query = { email, limit: 1, communityId: community.id }
	const shouldSearch = email && (!emailState.error || emailState.error.type === "alreadyMember")
	const { data: userSuggestions, status } = client.users.search.useQuery({
		queryKey: ["searchUsers", query, community.slug],
		queryData: shouldSearch ? { query, params: { communitySlug: community.slug } } : skipToken,
	})
	const user = userSuggestions?.body?.[0]
	const isPending = email && !emailState.invalid && status === "pending"

	const userIsAlreadyMember = useMemo(
		() => user && existingMembers.includes(user.id),
		[user, existingMembers]
	)
	useEffect(() => {
		if (userIsAlreadyMember) {
			form.setError("email", {
				type: "alreadyMember",
				message: "This user is already a member",
			})
		}
	}, [userIsAlreadyMember, form.setError])

	async function onSubmit(data: z.infer<typeof memberInviteFormSchema>) {
		if (!user) {
			// we manually do this check instead of letting zod do it
			// bc otherwis we need to either dynamically change the schema
			// or pass the state to the schema/form
			if (!data.firstName || !data.lastName) {
				form.setError(!data.firstName ? "firstName" : "lastName", {
					type: "manual",
					message: `Please provide a ${!data.firstName ? "first" : "last"} name`,
				})
				return
			}

			const result = await runCreateUserWithMembership({
				email: data.email,
				firstName: data.firstName,
				lastName: data.lastName,
				role: data.role,
				isSuperAdmin: data.isSuperAdmin,
				forms: data.forms,
			})

			if (didSucceed(result)) {
				toast({
					title: "Success",
					description: "User successfully invited",
				})
				closeForm()
			}

			return
		}

		const result = await runAddMember({
			userId: user.id,
			role: data.role,
			forms: data.forms,
		})

		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Member added successfully",
			})

			closeForm()
		}
	}

	const isContributor = form.watch("role") === MemberRole.contributor

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>

							<div className="flex items-center gap-x-2">
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
								{isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							</div>
							{!email || emailState.invalid ? (
								<FormDescription>
									Enter the email address of the person you'd like to add as a
									member.
								</FormDescription>
							) : !user ? (
								<FormDescription>
									This email is not yet associated with an account. You can still
									add them as a member.
								</FormDescription>
							) : null}

							<FormMessage />
						</FormItem>
					)}
				/>
				{!user && emailState.isDirty && (
					<>
						<FormField
							name="firstName"
							render={({ field }) => (
								<FormItem aria-label="First Name">
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="lastName"
							render={({ field }) => (
								<FormItem aria-label="Last Name">
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
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
				{email && !emailState.invalid && (
					<>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={MemberRole.admin}>Admin</SelectItem>
											<SelectItem value={MemberRole.editor}>
												Editor
											</SelectItem>
											<SelectItem value={MemberRole.contributor}>
												Contributor
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										Select the role for this user.
										<ul className="list-inside list-disc">
											<li>Admins can do anything.</li>
											<li>Editors are able to edit most things</li>
											<li>
												Contributors are only able to see forms and other
												public facing content that are linked to them
											</li>
										</ul>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{isContributor && !!availableForms.length && (
							<FormField
								control={form.control}
								name="forms"
								render={({ field }) => {
									const description = descriptions[membershipType]
									return (
										<FormItem>
											<FormLabel>Edit/View Access</FormLabel>
											<FormControl>
												<MultiSelect
													{...field}
													defaultValue={field.value ?? []}
													onValueChange={(newValues) => {
														field.onChange(newValues)
													}}
													options={availableForms.map((f) => ({
														label: f.name,
														value: f.id,
													}))}
													placeholder="Select forms"
												/>
											</FormControl>
											<FormDescription>{description}</FormDescription>
											<FormMessage />
										</FormItem>
									)
								}}
							/>
						)}
					</>
				)}
				{user && (
					<Card>
						<CardContent className="flex items-center gap-x-4 p-4">
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
								<span>{email}</span>
							</div>
						</CardContent>
					</Card>
				)}
				{email && !emailState.invalid && (
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : !user ? (
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
	)
}
