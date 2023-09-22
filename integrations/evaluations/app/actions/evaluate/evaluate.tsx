"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { parseSchema } from "json-schema-to-zod";
import { useEffect } from "react";
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
	Textarea,
	useLocalStorage,
	useToast,
	Input,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { evaluate } from "./actions";
import { GetPubResponseBody, GetPubTypeResponseBody } from "@pubpub/sdk";
import { createTsForm } from "@ts-react/form";

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
};

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	description: z.string().min(1, "Description is required"),
});

// create the mapping
const mapping = [
	[z.string(), Input],
	[z.number(), Input],
] as const; // 👈 `as const` is necessary

// A typesafe React component
const MyForm = createTsForm(mapping);

export function Evaluate(props: Props) {
	const { pub, pubType } = props;
	const myObject = {
		type: "object",
		properties: {
			hello: {
				type: "string",
			},
		},
	};
	// dangerously assert there is a schema, also ignore a typescript warning
	const zodSchema = parseSchema(pubType.fields![3].schema!.schema);
	const outputSchema = z
		.object({
			rating: z
				.number()
				.int()
				.lte(100)
				.describe(
					"A rating of quality from 0 to 100, with 0 being the worst and 100 being the best."
				)
				.optional(),
			confidence: z
				.number()
				.int()
				.gte(1)
				.lte(5)
				.describe("The degree of confidence the rater has in the rating given.")
				.optional(),
		})
		.describe("The confidence rating assigned to a work.");

	console.log(zodSchema);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: zodResolver(schema),
		defaultValues: {
			description: "",
		},
	});
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);

	const onSubmit2 = async (values) => {
		console.log("submitted", values);
	};

	const onSubmit = async (values: z.infer<typeof schema>) => {
		const result = await evaluate(
			props.instanceId,
			pub.id,
			pub.values.Title as string,
			values.description
		);
		if ("error" in result && typeof result.error === "string") {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "The pub was created successfully",
			});
			form.reset();
		}
	};

	const { reset } = form;
	useEffect(() => {
		reset(persistedValues, { keepDefaultValues: true });
	}, [reset]);

	const values = form.watch();
	useEffect(() => {
		persist(values);
	}, [values]);

	return (
		<>
			{zodSchema && (
				<MyForm
					schema={zodSchema}
					onSubmit={onSubmit2}
					renderAfter={() => <button type="submit">Submit</button>}
				/>
			)}
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Card>
						<CardHeader>
							<CardTitle>{pub.values.Title as string}</CardTitle>
							<CardDescription>Submit Your Evaluation</CardDescription>
						</CardHeader>
						<CardContent className={cn("flex flex-col column gap-4")}>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Evaluation</FormLabel>
										<FormControl>
											<Textarea {...field} />
										</FormControl>
										<FormDescription>
											The description of the work being submitted.
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
								{form.formState.isSubmitting && (
									<Icon.Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								Submit Evaluation
							</Button>
						</CardFooter>
					</Card>
				</form>
			</Form>
		</>
	);
}
