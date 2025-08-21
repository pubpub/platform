"use client";

import type { z } from "zod";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { zodToHtmlInputProps } from "ui/auto-form";
import { Button } from "ui/button";
import { MarkdownEditor } from "ui/editors";
import { Form, FormField } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";

import { useBuilder } from "../BuilderContext";
import { structuralElements } from "../StructuralElements";
import { type StructuralElement } from "../types";

type Props = {
	index: number;
	structuralElement: StructuralElement;
};

export const StructuralElementConfigurationForm = ({ index, structuralElement }: Props) => {
	const { update, dispatch, removeIfUnconfigured } = useBuilder();

	const schema = structuralElements[structuralElement.element].schema;

	if (!schema) {
		throw new Error(
			`No schema found for structural element ${structuralElement.element}. This should never happen.`
		);
	}

	const resolver = useMemo(() => zodResolver(schema), [schema]);

	const form = useForm<z.infer<typeof schema>>({
		resolver,
		defaultValues: schema.parse(structuralElement),
	});

	useUnsavedChangesWarning(form.formState.isDirty);

	const onSubmit = (values: z.infer<typeof schema>) => {
		update(index, { ...structuralElement, ...values, updated: true, configured: true });
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
						className="border-gray-950"
						variant="outline"
						onClick={() => {
							removeIfUnconfigured();
							dispatch({ eventName: "cancel" });
						}}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="bg-blue-500 hover:bg-blue-600"
						disabled={!form.formState.isDirty}
					>
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
