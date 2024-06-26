"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import type { FormsId } from "~/kysely/types/public/Forms";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { createForm } from "./actions";

const formCreateFormSchema = z.object({
	pubType: z.string().min(1),
	name: z.string().min(1),
});

const CreateFormForm = () => {
	const runCreateform = useServerAction(createForm);

	async function onSubmit(data: z.infer<typeof formCreateFormSchema>) {
		const result = await runCreateform({
			id: "abc" as FormsId,
			name: "form things agwan",
			pubTypeId: "def" as PubTypesId,
		});
		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Form created",
			});
		}
	}
	const form = useForm<z.infer<typeof formCreateFormSchema>>({
		resolver: zodResolver(formCreateFormSchema),
		defaultValues: {
			pubType: "",
			name: "",
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
								<FormDescription>What is the name of your form</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="pubType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slug</FormLabel>
								<Input {...field} />
								<FormDescription>
									Name the string you want your form to route to
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? (
							<Loader2 />
						) : (
							<div className="flex items-center gap-x-2">Create form</div>
						)}
					</Button>
				</form>
			</Form>
		</>
	);
};

export default CreateFormForm;
