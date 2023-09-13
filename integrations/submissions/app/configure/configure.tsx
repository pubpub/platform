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
import { configure } from "./actions";

type Props = {
	instanceId: string;
	pubTypeId?: string;
};

const schema = z.object({
	pubTypeId: z.string().length(36),
	instanceId: z.string(),
});

export function Configure(props: Props) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			pubTypeId: props.pubTypeId ?? "",
			instanceId: props.instanceId,
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
						<CardTitle>Submission Settings</CardTitle>
						<CardDescription>
							This form contains fields used to configure an instance of the
							submissions integration.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Input type="hidden" name="instanceId" value={props.instanceId} />
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
										submission form.
									</FormDescription>
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
