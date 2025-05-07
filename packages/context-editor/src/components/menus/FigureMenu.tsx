import type { Static } from "@sinclair/typebox";
import type { Mark, Node } from "prosemirror-model";

import React, { use, useMemo } from "react";
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState,
} from "@handlewithcare/react-prosemirror";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useForm } from "react-hook-form";
import { registerFormats } from "schemas";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ExternalLink, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Switch } from "ui/switch";

import { toggleFigureNode } from "../../commands/figures";
import { toggleMarkExpandEmpty } from "../../commands/marks";
import { baseSchema } from "../../schemas";
import { useEditorContext } from "../Context";
import { AdvancedOptions } from "./AdvancedOptions";

registerFormats();

const formSchema = Type.Object({
	enableTitle: Type.Boolean(),
	enableCaption: Type.Boolean(),
	id: Type.String(),
	class: Type.String(),
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

type LinkMenuProps = {
	node: Node;
	onChange: (values: Record<string, unknown>) => void;
};
export const FigureMenu = ({ node, onChange }: LinkMenuProps) => {
	const { position } = useEditorContext();

	const hasCaption = node.children.some((child) => child.type.name === "figcaption");
	const hasTitle = node.children.some((child) => child.type.name === "title");
	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			enableCaption: hasCaption,
			enableTitle: hasTitle,
			id: node.attrs?.id ?? "",
			class: node.attrs?.class ?? "",
		},
	});

	const handleSubmit = (values: FormSchema) => {
		if (position === null) {
			return;
		}
		// omit enableCaption and enableTitle, as they are controlled by the
		// prosemirror doc state
		const { enableCaption, enableTitle, ...rest } = values;
		onChange(rest);
	};

	const toggleTitle = useEditorEventCallback((view) => {
		if (position === null) {
			return;
		}
		toggleFigureNode(view.state, view.dispatch)(position, "title");
	});

	const toggleFigcaption = useEditorEventCallback((view) => {
		if (position === null) {
			return;
		}
		toggleFigureNode(view.state, view.dispatch)(position, "figcaption");
	});

	return (
		<Form {...form}>
			<form className="flex flex-col gap-4" onBlur={form.handleSubmit(handleSubmit)}>
				<FormField
					name="enableTitle"
					control={form.control}
					render={() => {
						return (
							<FormItem className="flex flex-col">
								<div className="flex items-center gap-2 space-y-0">
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Switch
											className="mr-2 data-[state=checked]:bg-emerald-400"
											checked={hasTitle}
											onCheckedChange={toggleTitle}
										/>
									</FormControl>
								</div>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					name="enableCaption"
					control={form.control}
					render={() => (
						<FormItem className="flex flex-col">
							<div className="flex items-center gap-2 space-y-0">
								<FormLabel>Caption</FormLabel>
								<FormControl>
									<Switch
										className="data-[state=checked]:bg-emerald-400"
										checked={hasCaption}
										onCheckedChange={toggleFigcaption}
									/>
								</FormControl>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
};
