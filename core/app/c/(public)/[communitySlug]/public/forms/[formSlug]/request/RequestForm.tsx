"use client";

import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import { didSucceed, useServerAction } from "~/lib/serverActions";
import * as actions from "../actions";

const schema = z.object({
	email: z.string().email(),
});

export const RequestForm = () => {
	const params = useParams<{ formSlug: string }>();
	const runInviteUserToForm = useServerAction(actions.TEST_inviteUserToForm);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(async (data) => {
					const result = await runInviteUserToForm({
						email: data.email,
						slug: params.formSlug,
					});
					if (didSucceed(result)) {
						toast({
							title: "Success",
							description: "User successfully invited to form",
						});
					}
				})}
				className="flex flex-col gap-y-4"
			>
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem aria-label="Email">
							<FormLabel>Email</FormLabel>
							<FormDescription>
								Enter the email address of the person you'd like to invite to this
								form
							</FormDescription>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="bg-blue-500">
					Request user
				</Button>
			</form>
		</Form>
	);
};
