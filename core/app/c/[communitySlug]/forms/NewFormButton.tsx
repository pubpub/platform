"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";

import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { createForm } from "./actions";

const schema = z.object({
	pubTypeName: z.string(),
	name: z.string(),
});

type Props = {
	pubTypes: { id: PubTypesId; name: string }[];
};

export const NewFormButton = ({ pubTypes }: Props) => {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm({
		resolver: zodResolver(schema),
	});

	const runCreateForm = useServerAction(createForm);
	const community = useCommunity();
	const router = useRouter();

	const onSubmit = async ({ pubTypeName, name }: z.infer<typeof schema>) => {
		const pubTypeId = pubTypes.find((type) => type.name === pubTypeName)?.id;
		if (!pubTypeId) {
			toast({
				title: "Error",
				description: `Unable to find pub type ${pubTypeName}`,
				variant: "destructive",
			});
			return;
		}
		const slug = await runCreateForm(pubTypeId, name, community.id);
		if (didSucceed(slug)) {
			toast({
				title: "Success",
				description: "Form created",
			});
			form.reset();
			router.push(`/c/${community.slug}/forms/${slug}`);
			setIsOpen(false);
		}
	};

	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button className="rounded bg-green-500 px-4 py-2 text-white shadow hover:bg-green-600">
					+ New Form
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				<DialogTitle>Create New Form</DialogTitle>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
						<FormField
							control={form.control}
							name="pubTypeName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Select a pub type</FormLabel>
									<FormDescription>
										Your form will be populated using all fields defined in this
										type, with submitted responses also adopting it.
									</FormDescription>
									<FormControl>
										<Select onValueChange={field.onChange} {...field}>
											<SelectTrigger>
												<SelectValue placeholder="Select a type">
													{field.value}{" "}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{pubTypes.map((pubType) => (
													<SelectItem
														key={pubType.id}
														value={pubType.name}
													>
														{pubType.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
						<DialogFooter className="mt-8">
							<Button
								onClick={() => {
									form.reset();
									setIsOpen(false);
								}}
								variant="outline"
								className="mr-4"
								type="button"
							>
								Cancel
							</Button>
							<Button type="submit" className="bg-blue-500">
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
