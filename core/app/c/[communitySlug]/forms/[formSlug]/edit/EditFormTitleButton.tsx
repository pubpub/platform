"use client";

import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

const editFormNameSchema = z.object({
	formName: z.string().min(1, "Form name is required"),
});

const EditFormTitleButton = ({ title }: { title: string }) => {
	const form = useForm<z.infer<typeof editFormNameSchema>>({
		resolver: zodResolver(editFormNameSchema),
		defaultValues: {
			formName: title,
		},
	});

	const onSubmit = (data: z.infer<typeof editFormNameSchema>) => {
		console.log(data);
	};
	return (
		<Dialog>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="ml-2 text-sm text-gray-500 hover:text-blue-600 hover:underline"
				>
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>Edit Name</DialogTitle>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="formName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Form Name</FormLabel>
									<FormControl>
										<Input defaultValue={field.value} {...field} />
									</FormControl>
									<FormMessage />
									<FormDescription>
										Change the name of your form here.
									</FormDescription>
								</FormItem>
							)}
						/>
						<DialogFooter className="flex justify-end">
							<Button variant="secondary" className="mr-2">
								Cancel
							</Button>
							<Button
								type="submit"
								variant="default"
								className="bg-[#0090FF] hover:bg-[#0079E3]"
							>
								Save
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export { EditFormTitleButton };
