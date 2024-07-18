"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Users } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2, Undo2, X, XCircle } from "ui/icon";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import { useServerAction } from "~/lib/serverActions";
import { UserLoginData } from "~/lib/types";
import * as actions from "./actions";

export const userInfoFormSchema = z.object({
	id: z.string().uuid(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	avatar: z
		.string()
		.url()
		.optional()
		.or(z.literal("").transform((v) => v || null))
		.or(z.null()),
});

export function UserInfoForm({ user }: { user: UserLoginData }) {
	const runUpdateUserInfo = useServerAction(actions.updateUserInfo);

	const form = useForm<z.infer<typeof userInfoFormSchema>>({
		resolver: zodResolver(userInfoFormSchema),
		mode: "onBlur",
		defaultValues: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName ?? "",
			email: user.email,
			avatar: user.avatar,
		},
	});

	const onSubmit = async (data: z.infer<typeof userInfoFormSchema>) => {
		const result = await runUpdateUserInfo({ data });
		if (result && "success" in result) {
			toast({
				title: "Success",
				description: "User information updated",
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<input type="hidden" name="id" value={user.id} />
				<FormField
					name="avatar"
					render={({ field }) => (
						<FormItem aria-label="Avatar">
							<Avatar className="group relative h-20 w-20">
								<AvatarImage src={field.value} />
								<AvatarFallback>
									{user.firstName[0]}
									{user.lastName?.[0]}
								</AvatarFallback>
								{field.value && (
									<Button
										type="button"
										variant="ghost"
										className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 p-0 text-red-500 group-hover:text-red-500"
										onClick={() => {
											form.setValue("avatar", "");
										}}
									>
										<XCircle
											className="hidden group-hover:block group-hover:text-red-500"
											size="20"
										/>
									</Button>
								)}
								{!field.value && user.avatar && (
									<Button
										type="button"
										variant="ghost"
										className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 p-0"
										onClick={() => form.setValue("avatar", user.avatar)}
									>
										<Undo2 className="hidden group-hover:block " size="20" />
									</Button>
								)}
							</Avatar>
							<FormLabel>Avatar URL</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
				<FormField
					name="email"
					render={({ field }) => (
						<FormItem aria-label="Email">
							<FormLabel>Email</FormLabel>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					disabled={
						form.formState.isSubmitting ||
						!form.formState.isValid ||
						!form.formState.isDirty
					}
					className="w-min flex-grow-0"
				>
					Save
					{form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
				</Button>
			</form>
		</Form>
	);
}
