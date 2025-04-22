import type { Static } from "@sinclair/typebox";
import type { Mark } from "prosemirror-model";

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
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

type LinkMenuProps = {
	mark: Mark;
	onChange: (attrKey: string, value: string | null) => void;
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

	const url: string = mark.attrs?.href ?? "";
	const openInNewTab = mark.attrs?.target === "_blank" ? true : false;

	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			href: url,
			openInNewTab,
		},
	});

	return (
		<>
			<Form {...form}>
				<form className="flex flex-col gap-4">
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
												defaultValue={url}
												onChange={(event) => {
													onChange(field.name, event.target.value);
													field.onChange(event);
												}}
												onBlur={field.onBlur}
												type="url"
												placeholder="https://example.com"
												autoFocus={url.length === 0}
											/>
										</FormControl>
										<div className="flex items-center">
											<a
												href={url}
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
										checked={openInNewTab}
										onCheckedChange={(checked) => {
											onChange("target", checked ? "_blank" : null);
											field.onChange(checked);
										}}
										onBlur={field.onBlur}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<hr />
					<AdvancedOptions mark={mark} onChange={onChange} />
				</form>
			</Form>
		</>
	);
};
