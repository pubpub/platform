import { SyntheticEvent, useCallback, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import { createUserWithMembership } from "~/app/c/[communitySlug]/members/[[...add]]/actions";
import { Communities } from "~/kysely/types/public/Communities";
import { didSucceed, useServerAction } from "~/lib/serverActions";

type Props = {
	email: string;
	community: Communities;
};

const addUserFormSchema = z.object({
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string().optional(),
});

export const UserSelectAddUserForm = ({ email, community }: Props) => {
	const [isPending, startTransition] = useTransition();
	const runCreateUserWithMembership = useServerAction(createUserWithMembership);

	const form = useForm<z.infer<typeof addUserFormSchema>>({
		resolver: zodResolver(addUserFormSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email,
		},
	});

	const onSubmitClick = useCallback(
		(e: SyntheticEvent) => {
			e.preventDefault();

			startTransition(() => {
				return form.handleSubmit(async ({ email, firstName, lastName }) => {
					const result = await runCreateUserWithMembership({
						email,
						firstName,
						lastName,
						community,
						canAdmin: false,
					});

					if (didSucceed(result)) {
						toast({
							title: "Success",
							description: "User successfully invited",
						});
					}
				})();
			});
		},
		[form, community]
	);

	return (
		<Form {...form}>
			<Card className="m-0 border-0 p-0 shadow-none">
				<CardHeader className="p-3">
					<CardTitle className="text-lg">Add User</CardTitle>
					<CardDescription>
						Upon submission, an email will be sent to notify this user of account
						creation.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-3">
					<div className="grid w-full items-center gap-2">
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem className="grid grid-cols-3 items-center gap-2">
									<FormLabel>First Name</FormLabel>
									<Input {...field} className="col-span-2 h-8" />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem className="grid grid-cols-3 items-center gap-2">
									<FormLabel>Last Name</FormLabel>
									<Input {...field} className="col-span-2 h-8" />
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</CardContent>
				<CardFooter className="flex items-stretch justify-stretch p-3">
					<Button variant="outline" onClick={onSubmitClick} className="w-full">
						Submit
					</Button>
				</CardFooter>
			</Card>
		</Form>
	);
};
