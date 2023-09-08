"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	useToast,
	Card,
	CardHeader,
	CardFooter,
	CardContent,
	CardTitle,
	CardDescription,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { submit } from "./actions";

type Props = {
	instanceId: string;
};

const schema = z.object({
	Title: z.string().min(1),
	instanceId: z.string(),
});

export function Submit(props: Props) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			Title: "",
			instanceId: props.instanceId,
		},
	});

	async function onSubmit(values: z.infer<typeof schema>) {
		const { instanceId, ...pub } = values;
		const result = await submit(instanceId, pub);
		if ("error" in result) {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "The pub was created successfully.",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>Submit Pub</CardTitle>
						<CardDescription>
							This form will create a pub from the fields below.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Input type="hidden" name="instanceId" value={props.instanceId} />
						<FormField
							control={form.control}
							name="Title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>The title of the pub.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
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
							Submit Pub
							{form.formState.isSubmitting && (
								<Icon.Spinner className="h-4 w-4 ml-4 animate-spin" />
							)}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
