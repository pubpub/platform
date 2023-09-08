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
} from "ui";
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
			pubTypeId: props.pubTypeId,
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
				<FormField
					control={form.control}
					name="pubTypeId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>PubType Id</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormDescription>Submitted pubs will be of this type.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Input type="hidden" name="instanceId" value={props.instanceId} />
				<Button variant="outline" onClick={() => window.history.back()}>
					Go back
				</Button>
				<Button variant="outline" type="submit">
					Configure
					{form.formState.isSubmitting && (
						<Icon.Spinner className="h-4 w-4 animate-spin" />
					)}
				</Button>
			</form>
			<FormMessage />
		</Form>
	);
}
