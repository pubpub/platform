"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import { didSucceed, useServerAction } from "~/lib/serverActions";
import { updateForm } from "./actions";

const editFormTitleSchema = z.object({
	name: z.string().min(1, "Form name is required"),
});

type NotificationProps = {
	message: string;
	success?: boolean;
};

const NotificationComponent: React.FC<NotificationProps> = ({ message, success = true }) => {
	return (
		<div
			className={`mx-auto flex max-w-lg items-center rounded-lg border p-4 shadow-md ${
				success
					? "border-green-200 bg-green-100 text-green-800"
					: "border-red-200 bg-red-100 text-red-800"
			}`}
		>
			<div className="mr-3 text-2xl">{success ? "✔️" : "❌"}</div>
			<div className="text-lg font-semibold">{message}</div>
		</div>
	);
};

const EditFormTitleButton = ({ formId, name }: { formId: string; name: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<z.infer<typeof editFormTitleSchema>>({
		resolver: zodResolver(editFormTitleSchema),
		defaultValues: {
			name,
		},
	});

	const runUpdateFormTitle = useServerAction(updateForm);
	const onSubmit = async (data: z.infer<typeof editFormTitleSchema>) => {
		const result = await runUpdateFormTitle({ formId, name: data.name });
		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: <NotificationComponent message="Name successfully updated" />,
			});
			setIsOpen(false);
		}
	};
	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen} modal={true}>
			<DialogTrigger asChild>
				<Button
					variant="link"
					className="ml-2 text-sm text-blue-500 hover:text-blue-600 hover:underline"
				>
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>Edit Name</DialogTitle>
				<hr />
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Form Name</FormLabel>
									<FormControl>
										<Input placeholder="Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className="flex justify-end">
							<Button
								variant="secondary"
								className="mr-2"
								onClick={() => {
									form.reset();
									setIsOpen(false);
								}}
							>
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
