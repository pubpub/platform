"use client";

import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Input } from "ui/input";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";

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
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="ml-2 text-sm text-gray-500 hover:text-blue-600 hover:underline"
				>
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Name</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={() => console.log("Eww")}>
						<Suspense fallback={<SkeletonCard />}>
							<div className="mb-4">
								<FormLabel
									htmlFor="formName"
									className="block text-sm font-medium text-gray-700"
								>
									Form Name
								</FormLabel>
								{/* <FormField
									control={form.control}
									name="formName"
									render={({ field }) => (
										<div className="grid gap-2">
											<FormItem>
												<FormLabel>Form Name</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
											</FormItem>
										</div>
									)}
								/> */}
							</div>
						</Suspense>
						<div className="flex justify-end">
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
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export { EditFormTitleButton };
