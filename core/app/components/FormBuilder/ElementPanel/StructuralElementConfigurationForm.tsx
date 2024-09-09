"use client";

import type { z } from "zod";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { zodToHtmlInputProps } from "ui/auto-form";
import { Button } from "ui/button";
import { MarkdownEditor } from "ui/editors";
import { Form, FormField } from "ui/form";

import { useFormBuilder } from "../FormBuilderContext";
import { structuralElements } from "../StructuralElements";
import { isStructuralElement } from "../types";

type Props = {
	index: number;
};

export const StructuralElementConfigurationForm = ({ index }: Props) => {
	const { selectedElement, update, dispatch, removeIfUnconfigured } = useFormBuilder();
	if (!selectedElement) {
		return null;
	}
	if (!isStructuralElement(selectedElement)) {
		return null;
	}

	const schema = structuralElements[selectedElement.element].schema;
	if (!schema) {
		return null;
	}

	const resolver = useMemo(() => zodResolver(schema), [schema]);
	const form = useForm<z.infer<typeof schema>>({
		resolver,
		defaultValues: schema.parse(selectedElement),
	});

	const onSubmit = (values: z.infer<typeof schema>) => {
		update(index, { ...selectedElement, ...values, updated: true, configured: true });
		dispatch({ eventName: "save" });
	};

	return (
		<Form {...form}>
			<form
				className="flex flex-grow flex-col"
				onSubmit={(e) => {
					e.stopPropagation(); //prevent submission from propagating to parent form
					form.handleSubmit(onSubmit)(e);
				}}
			>
				<div className="flex-grow">
					{(schema.keyof().options as string[]).map((name) => (
						<FormField
							key={name}
							control={form.control}
							name={name}
							render={({ field }) => (
								<div className="my-4">
									<MarkdownEditor
										zodInputProps={zodToHtmlInputProps(schema.shape[name])}
										field={field}
										fieldConfigItem={{
											description: undefined,
											inputProps: undefined,
											fieldType: undefined,
											renderParent: undefined,
											allowedSchemas: undefined,
										}}
										label={"Paragraph contents (markdown)"}
										isRequired={false}
										fieldProps={{
											...zodToHtmlInputProps(schema.shape[name]),
											...field,
										}}
										zodItem={schema.shape[name]}
									/>
								</div>
							)}
						/>
					))}
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button
						type="button"
						className="border-slate-950"
						variant="outline"
						onClick={() => {
							removeIfUnconfigured();
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
