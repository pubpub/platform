import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MarkdownEditor, zodToHtmlInputProps } from "ui/auto-form";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

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

	const form = useForm<z.infer<typeof SCHEMA>>({
		resolver: zodResolver(SCHEMA),
		defaultValues: button
			? {
					label: button.label ?? "",
					content: button.content ?? "",
					stageId: button.stageId ?? undefined,
				}
			: undefined,
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
