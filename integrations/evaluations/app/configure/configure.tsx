"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	Textarea,
	useToast,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { configure } from "./actions";

type Props = {
	instanceId: string;
	pubTypeId?: string;
};

const schema = z.object({
	pubTypeId: z.string().length(36),
	instanceId: z.string(),
	emailTemplate: z.string(),
});

export function Configure(props: Props) {
	const { toast } = useToast();
	let template: string = "";
	if (typeof window !== "undefined") {
		template = window.localStorage.getItem("emailTemplate") ?? "";
	}
	console.log("Template", template);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			pubTypeId: props.pubTypeId ?? "",
			instanceId: props.instanceId,
			emailTemplate: template ?? "Enter email template here",
		},
	});

	const saveToLocalStorage = (template: string) => {
		window.localStorage.setItem("emailTemplate", template);
	};

	async function onSubmit(values: z.infer<typeof schema>) {
		const result = await configure(values.instanceId, values.pubTypeId);
		if ("error" in result) {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "The instance was updated successfully.",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>Evaluations Settings</CardTitle>
						<CardDescription>
							This form contains fields used to configure an instance of the
							evaluations integration.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="pubTypeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Pub Type</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										The pub type determines the fields available on the
										evaluation form.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardContent>
						<FormField
							control={form.control}
							name="emailTemplate"
							render={({ field }) => (
								<FormItem>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "baseline",
											justifyContent: "space-between",
										}}
									>
										<FormLabel>Email Template</FormLabel>
										<FormControl className="mt-[8px]">
											<Textarea {...field} required />
										</FormControl>
										<FormDescription>
											The email template is what is sent to a user when they
											are invited to evaluate
										</FormDescription>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<Button
							onClick={(e) => {
								e.preventDefault();
								saveToLocalStorage(form.getValues().emailTemplate);
							}}
						>
							Save Template
						</Button>
					</CardContent>
					<CardFooter className={cn("flex justify-between")}>
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								window.history.back();
							}}
						>
							Go Back
						</Button>
						<Button type="submit" disabled={!form.formState.isValid}>
							Configure
							{form.formState.isSubmitting && (
								<Icon.Loader2 className="h-4 w-4 ml-4 animate-spin" />
							)}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
