import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createCommunity } from "./actions";

import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Button } from "ui/button";

export const communityCreateFormSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	avatar: z.string().optional(),
});

export const AddCommunityForm = () => {
	async function onSubmit(data: z.infer<typeof communityCreateFormSchema>) {
		console.log(data);
	}
	const form = useForm<z.infer<typeof communityCreateFormSchema>>({
		resolver: zodResolver(communityCreateFormSchema),
		defaultValues: {
			name: "",
			slug: "",
			avatar: "",
		},
	});

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<Input {...field} />
								<FormDescription>
									What is the name of your community
								</FormDescription>
								<FormMessage/>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem>
								<FormLabel>🐌 Slug</FormLabel>
								<Input {...field} />
								<FormDescription>
									Name the string in URL path for your community 
								</FormDescription>
								<FormMessage/>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="avatar"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Avatar Aang?</FormLabel>
								<Input {...field} />
								<FormDescription>
									What is the avatar for your community
								</FormDescription>
								<FormMessage/>
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? <Loader2 /> : (
							<div className="flex items-center gap-x-2">
								Create Community
							</div>
						)}
					</Button>
				</form>
			</Form>

		</>
	);
};
