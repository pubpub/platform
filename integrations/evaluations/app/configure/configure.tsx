"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Textarea } from "ui/textarea";
import { useToast } from "ui/use-toast";
import { cn } from "utils";

import type { InstanceConfig } from "~/lib/types";
import { configure } from "./actions";

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
	// coerce is used here to assert this field is a number, otherwise a vlaidation error will be thrown saying this is a string
	deadlineLength: z.coerce.number().min(0),
	deadlineUnit: z.enum(["days", "months"]),
});

const isActionRedirect = (props: Props): props is RedirectProps => {
	return "action" in props;
};

const defaultEmailTemplate = {
	subject: "You've been invited to review a submission on PubPub",
	message: "Please reach out if you have any questions.",
};

const defaultFormValues: InstanceConfig = {
	pubTypeId: "",
	evaluatorFieldSlug: "",
	titleFieldSlug: "",
	emailTemplate: defaultEmailTemplate,
	deadlineLength: 35,
	deadlineUnit: "days",
};

export function Configure(props: Props) {
	const { toast } = useToast();
	const defaultValues = useMemo(
		() => Object.assign({}, defaultFormValues, props.instanceConfig),
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
							<span>Deadline</span>
						</div>
						<FormField
							control={form.control}
							name="deadlineLength"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Deadline length</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>
										This field is used to determine thhe length of the deadline.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="deadlineUnit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Deadline Format</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a verified email to display" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="days">days</SelectItem>
											<SelectItem value="months">months</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										This field allows you to select whether the deadline is in
										days or months.
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
								<Loader2 className="ml-4 h-4 w-4 animate-spin" />
							)}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
