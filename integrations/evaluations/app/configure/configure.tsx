"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
	Button,
	Calendar,
	CalendarIcon,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
	useToast,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { InstanceConfig } from "~/lib/types";
import { configure } from "./actions";
import { format } from "date-fns";

type BaseProps = {
	instanceId: string;
	instanceConfig?: InstanceConfig;
	emailTemplate?: {
		subject: string;
		message: string;
	};
};

type RedirectProps = BaseProps & {
	action: string;
	pubId: string;
};

type Props = BaseProps | RedirectProps;

const schema: z.ZodType<InstanceConfig> = z.object({
	pubTypeId: z.string().length(36),
	evaluatorFieldSlug: z.string().min(1),
	titleFieldSlug: z.string().min(1),
	emailTemplate: z.object({
		subject: z.string(),
		message: z.string(),
	}),
	deadline: z.date(),
});

const isActionRedirect = (props: Props): props is RedirectProps => {
	return "action" in props;
};

const defaultEmailTemplate = {
	subject: "You've been invited to review a submission on PubPub",
	message: "Please reach out if you have any questions.",
};

const defaultInstanceConfig = {
	pubTypeId: "",
	evaluatorFieldSlug: "",
	titleFieldSlug: "",
	template: defaultEmailTemplate,
	deadline: new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000),
};

export function Configure(props: Props) {
	const { toast } = useToast();
	const defaultValues = useMemo(
		() => Object.assign({}, defaultInstanceConfig, props.instanceConfig),
		[]
	);
	const form = useForm<z.infer<typeof schema>>({
		mode: "all",
		resolver: zodResolver(schema),
		defaultValues,
	});
	const onSubmit = async (values: z.infer<typeof schema>) => {
		const result = await configure(props.instanceId, values);
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
	};

	useEffect(() => {
		if (isActionRedirect(props)) {
			toast({
				title: "Configure Instance",
				description: "Please configure the instance before managing evaluations.",
			});
		}
	}, []);

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
						<FormField
							control={form.control}
							name="deadline"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Deadline</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant={"outline"}
													className={cn(
														"w-[240px] pl-3 text-left font-normal",
														!field.value && "text-muted-foreground"
													)}
												>
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>Pick a date</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) => date < new Date()}
												defaultMonth={field.value}
											/>
										</PopoverContent>
									</Popover>
									<FormDescription>
										The deadline you want to set for reviewers
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="evaluatorFieldSlug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Evaluator Field</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										The name of the field used to store the evaluator's user id.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="titleFieldSlug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title Field</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										The name of the field used to store the evaluation title.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="text-xl font-medium">
							<span>Email Template</span>
						</div>
						<div className="mb-3">
							<FormField
								control={form.control}
								name="emailTemplate.subject"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subject</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>
											This is the default subject line for the email. You can
											change it by entering text above.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col justify-between align-baseline">
							<FormLabel>Body</FormLabel>
							<FormField
								control={form.control}
								name="emailTemplate.message"
								render={({ field }) => (
									<FormItem>
										<FormControl className="mt-[8px]">
											<Textarea {...field} required />
										</FormControl>
										<FormDescription>
											Change the default email message by entering text.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
					<CardFooter className={cn("flex justify-between")}>
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								if (isActionRedirect(props)) {
									window.location.href = `/${props.action}?instanceId=${props.instanceId}&pubId=${props.pubId}`;
								} else {
									window.history.back();
								}
							}}
						>
							Go Back{isActionRedirect(props) ? ` to ${props.action}` : ""}
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
