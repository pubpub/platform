"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { useForm, useFormContext } from "react-hook-form";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useFormField,
	useToast,
	useLocalStorage,
} from "ui";
import { DOI_REGEX, URL_REGEX, cn, isDoi, normalizeDoi } from "utils";
import * as z from "zod";
import { fetchMetadataUsingIdentifier, submit } from "./actions";

type Props = {
	instanceId: string;
};

const schema = z.object({
	Description: z.string().min(1, "Description is required"),
	DOI: z.string().regex(DOI_REGEX, "Invalid DOI"),
	Title: z.string().min(1, "Title is required"),
	URL: z.string().regex(URL_REGEX, "Invalid URL"),
	"Manager's Notes": z.string(),
});

type LoadMetadataProps = {
	value?: string;
};

const FetchMetadataButton = (props: LoadMetadataProps) => {
	const { toast } = useToast();
	const form = useFormContext();
	const { name: identifierKind } = useFormField();
	const state = form.getFieldState(identifierKind);
	const [pending, startTransition] = useTransition();
	const identifierValue = props.value ?? form.getValues()[identifierKind];

	const onFetchMetadata = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		const update = await fetchMetadataUsingIdentifier(identifierKind, identifierValue);
		if ("error" in update) {
			toast({
				title: "Error",
				description: (update as { error: string }).error,
				variant: "destructive",
			});
		} else {
			const values = form.getValues();
			const updateEntries = Object.entries(update).filter(
				([key, value]) => Boolean(value) && key in values
			);
			const updateFields = updateEntries.map(([key]) => key);
			if (updateEntries.length === 0) {
				toast({
					title: "Error",
					description: `We couldn't find any information about that ${identifierKind}`,
					variant: "destructive",
				});
			} else {
				for (const [field, value] of updateEntries) {
					form.setValue(field, value, { shouldDirty: true });
				}
				form.trigger(updateFields);
				toast({
					title: "Success",
					description: `Filled ${updateFields.join(", ")} using the ${identifierKind}`,
				});
			}
		}
	};

	const disabled = !state.isDirty || state.invalid;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						className={cn("px-0 ml-2")}
						onClick={(event) => startTransition(() => onFetchMetadata(event))}
						disabled={disabled}
					>
						{pending ? (
							<Icon.Loader2 height={18} className="animate-spin" />
						) : (
							<Icon.Wand2 height={18} color="currentColor" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Auto-fill submission</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export function Submit(props: Props) {
	const { toast } = useToast();
	const [persistedValues, persist] = useLocalStorage<z.infer<typeof schema>>(props.instanceId);
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: zodResolver(schema),
		defaultValues: {
			"Manager's Notes": "",
			Title: "",
			Description: "",
			DOI: "",
			URL: "",
		},
	});

	const onSubmit = async (pub: z.infer<typeof schema>) => {
		if ("DOI" in pub) {
			pub.DOI = normalizeDoi(pub.DOI);
		}
		const result = await submit(props.instanceId, pub);
		if ("error" in result) {
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

	const values = form.watch();
	useEffect(() => {
		persist(values);
	}, [values]);

	const { reset } = form;
	useEffect(() => {
		reset(persistedValues, { keepDefaultValues: true });
	}, [reset]);

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
									return (
										<FormItem className={cn("flex-1")}>
											<FormLabel>DOI</FormLabel>
											<FormControl>
												<div className={cn("flex items-center")}>
													<Input {...field} />
													<FetchMetadataButton
														value={
															isDoi(field.value)
																? normalizeDoi(field.value)
																: ""
														}
													/>
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
