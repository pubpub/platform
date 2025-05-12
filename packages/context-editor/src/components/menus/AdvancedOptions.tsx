import type { Static } from "@sinclair/typebox";
import type { Node } from "prosemirror-model";

import React, { useMemo, useState } from "react";
import { useEditorEffect } from "@handlewithcare/react-prosemirror";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useForm } from "react-hook-form";
import { registerFormats } from "schemas";

import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { Form } from "ui/form";
import { ChevronDown, ChevronUp } from "ui/icon";

import { MenuInputField } from "./MenuFields";

registerFormats();

const formSchema = Type.Object({
	id: Type.String(),
	class: Type.String(),
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

type Props = {
	node: Node;
	onChange: (values: Record<string, unknown>) => void;
};

export const AdvancedOptions = (props: Props) => {
	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			id: props.node.attrs?.id ?? "",
			class: props.node.attrs?.class ?? "",
		},
	});

	useEditorEffect(() => {
		form.reset({
			id: props.node.attrs?.id ?? "",
			class: props.node.attrs?.class ?? "",
		});
		setIsOpen(false);
	}, [props.node]);

	return (
		<Form {...form}>
			<form className="mt-2 flex flex-col gap-4" onBlur={form.handleSubmit(props.onChange)}>
				<Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">Advanced Options</h3>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="w-9 p-0"
								data-testid="advanced-options-trigger"
							>
								{isOpen ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
								<span className="sr-only">Toggle</span>
							</Button>
						</CollapsibleTrigger>
					</div>
					<CollapsibleContent className="space-y-2">
						<MenuInputField name="id" />
						<MenuInputField name="class" />
					</CollapsibleContent>
				</Collapsible>
			</form>
		</Form>
	);
};
