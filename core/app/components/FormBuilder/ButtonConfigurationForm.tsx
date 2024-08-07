import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import { useCommunity } from "../providers/CommunityProvider";
import { useFormBuilder } from "./FormBuilderContext";

export const DEFAULT_BUTTON = {
	label: "Submit",
	content: "Thank you for your submission",
	buttonType: "Primary Button",
};

const SCHEMA = z.object({
	label: z.string(),
	content: z.string(),
	stageId: z.string().optional(),
});

export const ButtonConfigurationForm = ({ id }: { id: string | null }) => {
	const { elements, dispatch } = useFormBuilder();
	const button = elements.find((e) => e.id === id);
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

	const form = useForm<z.infer<typeof SCHEMA>>({
		resolver: zodResolver(SCHEMA),
		defaultValues,
	});

	const onSubmit = (values: z.infer<typeof SCHEMA>) => {
		console.log({ values });
		// update(index, { ...selectedElement, ...values, updated: true, configured: true });
		// dispatch({ eventName: "save" });
	};

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.stopPropagation(); //prevent submission from propagating to parent form
					form.handleSubmit(onSubmit, (f) => console.log(f))(e);
				}}
				className="flex h-full flex-col justify-between gap-2"
			>
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
							zodInputProps={zodToHtmlInputProps(SCHEMA.shape.content)}
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
								...zodToHtmlInputProps(SCHEMA.shape.content),
								...field,
							}}
							zodItem={SCHEMA.shape.content}
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
