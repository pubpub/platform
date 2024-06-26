"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
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
			id: "abc" as FormsId, // change this to a real id
			name: data.name,
			pubTypeId: data.pubType as PubTypesId,
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

	const pubTypes = [
		{ id: "1" as PubTypesId, name: "Submission" },
		{ id: "2" as PubTypesId, name: "Evaluation" },
		{ id: "3" as PubTypesId, name: "Evaluation Summary" },
		{ id: "4" as PubTypesId, name: "Author Response" },
	];

	return (
		<div className="w-full max-w-md rounded-lg bg-white p-6 ">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-xl font-semibold">Create New Form</h2>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
					<FormField
						control={form.control}
						name="pubType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Select a pub type</FormLabel>
								<Select onValueChange={field.onChange} {...field}>
									<SelectTrigger>
										<SelectValue placeholder="Select a field">
											{/* thomas has said ->  "without the {" "} the field.value sometimes doesn't render, weird" */}
											{field.value}{" "}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{pubTypes.map((pubType) => (
											<SelectItem key={pubType.id} value={pubType.name}>
												{pubType.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Your form will be populated using all fields defined in this
									type, with submitted responses also adopting it.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								{/* these names need to be validated as unique or show a special error message */}
								<FormLabel>Form Name</FormLabel>
								<Input {...field} placeholder="Name" />
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end">
						<Button className="mr-2 rounded  px-4 py-2" variant="outline">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
							className="rounded bg-blue-500 px-4 py-2 text-white"
						>
							{form.formState.isSubmitting ? (
								<Loader2 />
							) : (
								<div className="flex items-center gap-x-2">Create</div>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default CreateFormForm;
