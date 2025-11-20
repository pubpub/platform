"use client"

import type { z } from "zod"
import type { MemberEditDialogProps } from "./types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { MemberRole } from "db/public"
import { Button } from "ui/button"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form"
import { Loader2, UserPlus } from "ui/icon"
import { MultiSelect } from "ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { toast } from "ui/use-toast"

import { didSucceed, useServerAction } from "~/lib/serverActions"
import { updateMember } from "./actions"
import { descriptions } from "./constants"
import { memberEditFormSchema } from "./memberInviteFormSchema"

export const MemberEditForm = ({
	member,
	closeForm,
	membershipTargetId,
	membershipType,
	availableForms,
}: MemberEditDialogProps & {
	closeForm: () => void
}) => {
	const runUpdateMember = useServerAction(updateMember)

	const form = useForm<z.infer<typeof memberEditFormSchema>>({
		resolver: zodResolver(memberEditFormSchema),
		defaultValues: {
			role: member.role,
			forms: member.forms,
		},
		mode: "onChange",
	})

	async function onSubmit(data: z.infer<typeof memberEditFormSchema>) {
		const result = await runUpdateMember({
			userId: member.userId,
			role: data.role,
			forms: data.forms,
			targetId: membershipTargetId,
			targetType: membershipType,
		})

		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Member updated successfully",
			})

			closeForm()
		}
	}

	const isContributor = form.watch("role") === MemberRole.contributor

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				{
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
				}
				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<span className="flex items-center gap-x-2">
							<UserPlus size="16" /> Update Member
						</span>
					)}
				</Button>
			</form>
		</Form>
	)
}
