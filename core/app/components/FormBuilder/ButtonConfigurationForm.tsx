import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import type { StagesId } from "db/public";
import { ElementType } from "db/public";
import { MarkdownEditor, zodToHtmlInputProps } from "ui/auto-form";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { ChevronDown } from "ui/icon";
import { Input } from "ui/input";
import { cn } from "utils";

import type { ButtonElement } from "./types";
import { useCommunity } from "../providers/CommunityProvider";
import { useFormBuilder } from "./FormBuilderContext";
import { ButtonOption } from "./SubmissionSettings";
import { isButtonElement } from "./types";

const DEFAULT_BUTTON = {
	label: "Submit",
	content: "Thank you for your submission",
};

export const ButtonConfigurationForm = ({ id }: { id: string | null }) => {
	const { dispatch, update } = useFormBuilder();
	// This uses the parent's form context to get the most up to date version of 'elements'
	const { getValues } = useFormContext();
	// Derive some initial values based on the state of the parent form when this panel was opened
	const { button, buttonIndex, otherButtons } = useMemo(() => {
		const elements = getValues()["elements"];
		const button = id
			? elements.find((e) => {
					// because we can add buttons without saving first, not all buttons will have an existing ID yet
					// so we fallback to label
					return e.elementId === id || e.label === id;
				})
			: undefined;
		const otherButtons: ButtonElement[] = elements.filter(
			(e) => isButtonElement(e) && e.elementId !== id
		);
		const buttonIndex = elements.findIndex((e) => e.elementId === id);
		return { button, buttonIndex, otherButtons };
	}, []);

	const schema = z.object({
		label: z.string().refine((l) => !otherButtons.find((b) => b.label === l), {
			message: "There is already a button with this label",
		}),
		content: z.string(),
		stageId: z.string().optional(),
	});

	const community = useCommunity();
	const { stages } = community;

	const defaultValues = button
		? {
				label: button.label ?? "",
				content: button.content ?? "",
				stageId: button.stageId ?? undefined,
			}
		: {
				label: DEFAULT_BUTTON.label,
				content: DEFAULT_BUTTON.content,
				stageId: undefined,
			};

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues,
	});

	const onSubmit = (values: z.infer<typeof schema>) => {
		const index = buttonIndex === -1 ? 0 : buttonIndex;
		update(index, {
			order: null,
			type: ElementType.button,
			elementId: button?.elementId,
			label: values.label,
			content: values.content,
			stageId: values.stageId as StagesId | undefined,
			updated: true,
			configured: true,
		});
		dispatch({ eventName: "save" });
	};
	const labelValue = form.watch("label");

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.stopPropagation(); //prevent submission from propagating to parent form
					form.handleSubmit(onSubmit)(e);
				}}
				className="flex h-full flex-col justify-between gap-2 pt-2"
			>
				<ButtonOption label={labelValue} readOnly />
				<FormField
					control={form.control}
					name="label"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Button label</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<MarkdownEditor
							zodInputProps={zodToHtmlInputProps(schema.shape.content)}
							// @ts-ignore can't seem to infer this is ok for FieldValues
							field={field}
							fieldConfigItem={{
								description: undefined,
								inputProps: undefined,
								fieldType: undefined,
								renderParent: undefined,
								allowedSchemas: undefined,
							}}
							label="Post-submission message"
							isRequired={false}
							fieldProps={{
								...zodToHtmlInputProps(schema.shape.content),
								...field,
							}}
							zodItem={schema.shape.content}
							description="The message displayed after submission. Markdown supported."
							descriptionPlacement="bottom"
						/>
					)}
				/>
				<FormField
					name="stageId"
					control={form.control}
					render={({ field }) => {
						const currentValue = field.value
							? stages.find((s) => s.id === field.value)?.name
							: undefined;
						return (
							<FormItem
								aria-label="Stage"
								className="flex flex-col items-start gap-2"
							>
								<FormLabel>Post-submission stage</FormLabel>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="outline"
											className={cn(
												"relative w-full justify-between bg-white",
												{
													"text-muted-foreground": !currentValue,
												}
											)}
										>
											{currentValue || "Select a stage"}
											<ChevronDown size="16" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{stages.map((stage) => (
											<DropdownMenuItem
												key={stage.id}
												onClick={() => {
													field.onChange(stage.id);
												}}
											>
												{stage.name}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								<FormDescription>
									The stage the pub should be in after submission
								</FormDescription>

								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<div className="grid grid-cols-2 gap-2">
					<Button
						type="button"
						className="border-slate-950"
						variant="outline"
						onClick={() => {
							dispatch({ eventName: "cancel" });
						}}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-blue-500 hover:bg-blue-600">
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
