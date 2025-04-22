import type { Static } from "@sinclair/typebox";
import type { Mark } from "prosemirror-model";
import type { FieldValues } from "react-hook-form";

import React, { useMemo } from "react";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";
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

import { toggleMarkExpandEmpty } from "../../commands/marks";
import { baseSchema } from "../../schemas";
import { AdvancedOptions } from "./AdvancedOptions";

registerFormats();

const formSchema = Type.Object({
	href: Type.String({ format: "uri" }),
	openInNewTab: Type.Boolean({ default: false }),
	id: Type.String(),
	class: Type.String(),
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

type LinkMenuProps = {
	mark: Mark;
	onChange: (values: Record<string, string | null>) => void;
};
export const LinkMenu = ({ mark, onChange }: LinkMenuProps) => {
	if (!(mark.type.name === "link")) {
		return null;
	}

	const removeLink = useEditorEventCallback((view) =>
		toggleMarkExpandEmpty({
			state: view.state,
			dispatch: view.dispatch,
			type: baseSchema.marks.link,
		})
	);

	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			href: mark.attrs?.href ?? "",
			openInNewTab: mark.attrs?.target === "_blank" ? true : false,
			id: mark.attrs?.id ?? "",
			class: mark.attrs?.class ?? "",
		},
	});

	const handleSubmit = (values: FormSchema) => {
		const { openInNewTab, ...rest } = values;
		const attrs = { ...rest, target: values.openInNewTab ? "_blank" : null };
		onChange(attrs);
	};

	return (
		<>
			<Form {...form}>
				<form className="flex flex-col gap-4" onBlur={form.handleSubmit(handleSubmit)}>
					<h2 className="text-md font-medium">Link Attributes</h2>
					<FormField
						name="href"
						control={form.control}
						render={({ field }) => {
							return (
								<FormItem className="flex flex-col">
									<div className="flex items-center gap-2 space-y-0">
										<FormLabel>URL</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="url"
												placeholder="https://example.com"
												autoFocus={field.value.length === 0}
											/>
										</FormControl>
										<div className="flex items-center">
											<a
												href={field.value}
												target="_blank"
												className="cursor-pointer text-gray-500"
											>
												<ExternalLink strokeWidth="1px" size="20" />
											</a>
											<Button
												className="px-2 text-gray-500"
												variant="ghost"
												onClick={removeLink}
												data-testid="remove-link"
											>
												<Trash />
											</Button>
										</div>
									</div>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<hr />
					<FormField
						name="openInNewTab"
						control={form.control}
						render={({ field }) => (
							<FormItem className="flex items-center justify-between">
								<FormLabel>Open in new tab</FormLabel>
								<FormControl>
									<Switch
										className="data-[state=checked]:bg-emerald-400"
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<hr />
					<AdvancedOptions mark={mark} />
				</form>
			</Form>
		</>
	);
};
