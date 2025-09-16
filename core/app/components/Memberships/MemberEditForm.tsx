"use client";

import type { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { MemberRole, MembershipType } from "db/public";
import { Button } from "ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Loader2, UserPlus } from "ui/icon";
import { MultiSelect } from "ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";

import type { MemberEditDialogProps } from "./types";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { memberEditFormSchema } from "./memberInviteFormSchema";

export const descriptions: Record<MembershipType, string> = {
	[MembershipType.pub]:
		"Select the forms via which this member can edit and view this Pub. If no form is selected, they will only be able to view the Pub, and will only see fields added to the default Pub form for this type.",
	[MembershipType.stage]:
		"Select the forms via which this member can edit and view Pubs in this stage. If no form is selected, they will only be able to view Pubs in this stage, and will only see fields added to the default Pub form for a each Pub type.",
	[MembershipType.community]:
		"Selecting forms will give the member the ability to create Pubs in the community using the selected forms. If no forms are added, the contributor will not be able to create any Pubs, and will only be able to see Pubs they have access to either directly or at the stage level.",
};

export const MemberEditForm = ({
	member,
	updateMember,
	closeForm,
	membershipType,
	availableForms,
}: MemberEditDialogProps & {
	closeForm: () => void;
}) => {
	const runUpdateMember = useServerAction(updateMember);

	const form = useForm<z.infer<typeof memberEditFormSchema>>({
		resolver: zodResolver(memberEditFormSchema),
		defaultValues: {
			role: member.role,
			forms: member.forms,
		},
		mode: "onChange",
	});

	async function onSubmit(data: z.infer<typeof memberEditFormSchema>) {
		const result = await runUpdateMember({
			userId: member.userId,
			role: data.role,
			forms: data.forms,
		});

		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Member added successfully",
			});

			closeForm();
		}
	}

	const isContributor = form.watch("role") === MemberRole.contributor;

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
									const description = descriptions[membershipType];
									return (
										<FormItem>
											<FormLabel>Edit/View Access</FormLabel>
											<FormControl>
												<MultiSelect
													{...field}
													defaultValue={field.value ?? []}
													onValueChange={(newValues) => {
														field.onChange(newValues);
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
									);
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
	);
};
