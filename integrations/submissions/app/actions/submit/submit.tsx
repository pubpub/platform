"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useIntegration } from "@pubpub/sdk/react";
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
import { useLocalStorage } from "ui/hooks";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { useToast } from "ui/use-toast";
import { cn, DOI_REGEX, isDoi, normalizeDoi, URL_REGEX } from "utils";

import { submit } from "./actions";
import { FetchMetadataButton } from "./FetchMetadataButton";

type Props = {
	instanceId: string;
};

const optional = (schema: z.ZodType<any, any>) =>
	z.preprocess((value) => {
		if (!value || typeof value !== "string") return undefined;
		return value === "" ? undefined : value;
	}, schema.optional());

// TODO: generate fields using instance's configured PubType
const schema = z.object({
	"legacy-unjournal:description": optional(z.string().optional()),
	"legacy-unjournal:doi": optional(z.string().regex(DOI_REGEX, "Invalid DOI")),
	"legacy-unjournal:title": z.string().min(3, "Title is required"),
	"legacy-unjournal:url": optional(z.string().regex(URL_REGEX, "Invalid URL")),
	"legacy-unjournal:managers-notes": optional(z.string()),
});

export function Submit(props: Props) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		// TODO: generate fields using instance's configured PubType
		resolver: zodResolver(schema),
		defaultValues: {
			"legacy-unjournal:managers-notes": "",
			"legacy-unjournal:title": "",
			"legacy-unjournal:description": "",
			"legacy-unjournal:doi": "",
			"legacy-unjournal:url": "",
		},
	});
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);

	const { user } = useIntegration();
	const onSubmit = async (pub: z.infer<typeof schema>) => {
		// The DOI field may contain either a DOI or a URL that contains a DOI.
		// If the value is a URL, we convert it into a valid DOI before sending
		// it to core PubPub.
		if (pub["legacy-unjournal:doi"]) {
			pub["legacy-unjournal:doi"] = normalizeDoi(pub["legacy-unjournal:doi"]);
		}
		const result = await submit(props.instanceId, pub, user.id);
		if ("error" in result && typeof result.error === "string") {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "The submission was created successfully!",
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
					<CardContent className={cn("column flex flex-col gap-4")}>
						<FormField
							control={form.control}
							name="legacy-unjournal:title"
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
							name="legacy-unjournal:description"
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
								name="legacy-unjournal:doi"
								render={({ field }) => {
									// If a user inputs a URL containing a DOI, or a DOI with a specifier
									// like doi:10.1234, send only DOI with the request to auto-fill
									// metadata.
									const normalizedDoi =
										field.value && isDoi(field.value)
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
								name="legacy-unjournal:url"
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
							name="legacy-unjournal:managers-notes"
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
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Submit Pub
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
