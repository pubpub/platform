"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { richTextInputConfigSchema } from "schemas";

import { InputComponent } from "db/public";
import { FormField } from "ui/form";
import { Skeleton } from "ui/skeleton";

import type { ElementProps } from "../types";
import { renderNodeToHTML } from "~/lib/editor/serialization/client";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const LazyContextEditorElement = dynamic(
	() => import("./ContextEditorLazyElement").then((mod) => mod.EditorFormElementLazy),
	{
		ssr: false,
		loading: () => <Skeleton className="h-16 w-full" />,
	}
);

export const ContextEditorElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.richText>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	Value.Default(richTextInputConfigSchema, config);
	if (!Value.Check(richTextInputConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				return (
					<LazyContextEditorElement
						label={label}
						help={config.help}
						onChange={(state) => {
							field.onChange(renderNodeToHTML(state.doc));
						}}
						initialValue={field.value}
						disabled={!isEnabled}
					/>
				);
			}}
		/>
	);
};
