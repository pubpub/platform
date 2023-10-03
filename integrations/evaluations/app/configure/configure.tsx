"use client";
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
	template: z.object({
		subject: z.string(),
		message: z.string(),
	}),
});

export function Configure(props: Props) {
	const { toast } = useToast();
	let message: string = "";
	let subject: string = "";
	if (typeof window !== "undefined") {
		subject = window.localStorage.getItem("subject") ?? "";
		message = window.localStorage.getItem("message") ?? "";
	}
	const saveToLocalStorage = (template: { subject: string; message: string }) => {
		window.localStorage.setItem("subject", template.subject);
		window.localStorage.setItem("message", template.message);
	};

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			pubTypeId: props.pubTypeId ?? "",
			instanceId: props.instanceId,
			template: {
				subject:
					subject !== ""
						? subject
						: "You've been invited to review a submission on PubPub",
				message: message !== "" ? message : `Please reach out if you have any questions.`,
			},
		},
	});

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
						<div className="text-xl font-medium">
							<span>Email Template</span>
						</div>
					</CardContent>
					<CardContent>
						<div className="mb-3">
							<FormField
								control={form.control}
								name="template.subject"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subject</FormLabel>
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
						</div>
						<div className="flex flex-col justify-between align-baseline">
							<FormLabel>Email Message</FormLabel>
							<div className="mt-2 mb-4">
								Hello {"Jill"} {"Admin"}! You've been invited to evaluate{" "}
								<a className="text-sky-400/100" href="https://www.pubpub.org">
									Example Pub
								</a>{" "}
								on PubPub.
							</div>
							<FormField
								control={form.control}
								name="template.message"
								render={({ field }) => (
									<FormItem>
										<FormControl className="mt-[8px]">
											<Textarea {...field} required />
										</FormControl>
										<FormDescription>
											Your email will begin with the above content. Add plain
											text to customize the email.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button
							onClick={(e) => {
								e.preventDefault();
								saveToLocalStorage(form.getValues().template);
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
