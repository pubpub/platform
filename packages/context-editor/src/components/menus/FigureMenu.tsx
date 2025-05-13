import type { Static } from "@sinclair/typebox";
import type { Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

import React, { useMemo } from "react";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useForm } from "react-hook-form";
import { registerFormats } from "schemas";

import { Form } from "ui/form";

import { toggleFigureNode } from "../../commands/figures";
import { useEditorContext } from "../Context";
import { MenuSwitchField } from "./MenuFields";

registerFormats();

const formSchema = Type.Object({
	title: Type.Boolean(),
	caption: Type.Boolean(),
	credit: Type.Boolean(),
	license: Type.Boolean(),
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

	const title = node.children.some((child) => child.type.name === "title");
	const caption = node.children.some((child) => child.type.name === "figcaption");
	const credit = node.children.some((child) => child.type.name === "credit");
	const license = node.children.some((child) => child.type.name === "license");
	const isMedia = node.children.some((child) => child.type.name === "image");

	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			license,
			credit,
			caption,
			title,
			id: node.attrs?.id ?? "",
			class: node.attrs?.class ?? "",
		},
	});

	const handleSubmit = (values: FormSchema) => {
		if (position === null) {
			return;
		}
		// omit caption and title, as they are controlled by the
		// prosemirror doc state
		const { caption, title, credit, license, ...rest } = values;
		onChange(rest);
	};

	const makeNodeToggle = (name: "title" | "figcaption" | "credit" | "license") => {
		return (view: EditorView) => {
			if (position === null) {
				return;
			}
			toggleFigureNode(view.state, view.dispatch)(position, name);
		};
	};

	const toggleTitle = useEditorEventCallback(makeNodeToggle("title"));
	const toggleCaption = useEditorEventCallback(makeNodeToggle("figcaption"));
	const toggleCredit = useEditorEventCallback(makeNodeToggle("credit"));
	const toggleLicense = useEditorEventCallback(makeNodeToggle("license"));

	return (
		<Form {...form}>
			<form className="flex flex-col gap-4" onBlur={form.handleSubmit(handleSubmit)}>
				<MenuSwitchField name="title" label="Title" value={title} onChange={toggleTitle} />
				<MenuSwitchField
					name="caption"
					label="Caption"
					value={caption}
					onChange={toggleCaption}
				/>
				{isMedia && (
					<>
						<MenuSwitchField
							name="credit"
							label="Credit"
							value={credit}
							onChange={toggleCredit}
						/>
						<MenuSwitchField
							name="license"
							label="License"
							value={license}
							onChange={toggleLicense}
						/>
					</>
				)}
			</form>
		</Form>
	);
};
