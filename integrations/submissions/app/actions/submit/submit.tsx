"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
	Input,
	Textarea,
	useLocalStorage,
	useToast,
} from "ui";
import { DOI_REGEX, URL_REGEX, cn, isDoi, normalizeDoi } from "utils";
import * as z from "zod";
import { FetchMetadataButton } from "./FetchMetadataButton";
import { submit } from "./actions";

type Props = {
	instanceId: string;
};

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	Description: z.string().min(1, "Description is required"),
	DOI: z.string().regex(DOI_REGEX, "Invalid DOI"),
	Title: z.string().min(1, "Title is required"),
	URL: z.string().regex(URL_REGEX, "Invalid URL"),
	"Manager's Notes": z.string(),
});

export function Submit(props: Props) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		// TODO: generate fields using instance's configured PubType
		resolver: zodResolver(schema),
		defaultValues: {
			"Manager's Notes": "",
			Title: "",
			Description: "",
			DOI: "",
			URL: "",
		},
	});
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);

	const onSubmit = async (pub: z.infer<typeof schema>) => {
		// The DOI field may contain either a DOI or a URL that contains a DOI.
		// If the value is a URL, we convert it into a valid DOI before sending
		// it to core PubPub.
		if ("DOI" in pub) {
			pub.DOI = normalizeDoi(pub.DOI);
		}
		const result = await submit(props.instanceId, pub);
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

	// Load the persisted values.
	const { reset } = form;
	useEffect(() => {
		// `keepDefaultValues` is set to true to prevent the form from
		// validating fields that were not filled during the previous session.
		reset(persistedValues, { keepDefaultValues: true });
	}, [reset]);

	// Persist form values to local storage. This operation is debounced by
	// the timeout passed to <LocalStorageProvider>.
	const values = form.watch();
	useEffect(() => {
		persist(values);
	}, [values]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>Submit Pub</CardTitle>
						<CardDescription>Create a new submission.</CardDescription>
					</CardHeader>
					<CardContent className={cn("flex flex-col column gap-4")}>
						<FormField
							control={form.control}
							name="Title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<div className={cn("flex items-center")}>
											<Input {...field} />
											<FetchMetadataButton />
										</div>
									</FormControl>
									<FormDescription>
										The title of the work being submitted.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="Description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Abstract</FormLabel>
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
						<div className={cn("flex gap-4")}>
							<FormField
								control={form.control}
								name="DOI"
								render={({ field }) => {
									// If a user inputs a URL containing a DOI, or a DOI with a specifier
									// like doi:10.1234, send only DOI with the request to auto-fill
									// metadata.
									const normalizedDoi = isDoi(field.value)
										? normalizeDoi(field.value)
										: "";
									return (
										<FormItem className={cn("flex-1")}>
											<FormLabel>DOI</FormLabel>
											<FormControl>
												<div className={cn("flex items-center")}>
													<Input {...field} />
													<FetchMetadataButton value={normalizedDoi} />
												</div>
											</FormControl>
											<FormDescription
												className={cn("flex items-start justify-between")}
											>
												The DOI of the work being submitted. Use the
												download button to auto-fill fields using the DOI.
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name="URL"
								render={({ field }) => (
									<FormItem className={cn("flex-1")}>
										<FormLabel>URL</FormLabel>
										<FormControl>
											<div className={cn("flex items-center")}>
												<Input {...field} />
												<FetchMetadataButton />
											</div>
										</FormControl>
										<FormDescription
											className={cn("flex items-start justify-between")}
										>
											The canonical URL of the work being submitted. Use the
											download button to auto-fill fields using the URL.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							// TODO: This field is not working, probably because
							// the name contains a space.
							control={form.control}
							name="Manager's Notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Manager's Notes</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
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
							Submit Pub
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
