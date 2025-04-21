import type { Static } from "@sinclair/typebox";
import type { Mark } from "prosemirror-model";

import React from "react";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";

import { Button } from "ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { ExternalLink, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Switch } from "ui/switch";

import { toggleMarkExpandEmpty } from "../../commands/marks";
import { baseSchema } from "../../schemas";

const formSchema = Type.Object({
	href: Type.String(),
	openInNewTab: Type.Boolean({ default: false }),
});

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

	const form = useForm<FormSchema>({
		resolver: typeboxResolver(formSchema),
		// defaultValues: {
		// 	href: node?.attrs?.href ?? "",
		// 	openInNewTab: node?.attrs?.target === "_blank",
		// },
	});

	const url = mark.attrs?.href ?? "";
	const openInNewTab = mark.attrs?.target === "_blank" ? true : false;

	return (
		<>
			<div>Link Attributes</div>
			<Form {...form}>
				<form className="flex flex-col gap-2">
					<FormField
						name="href"
						control={form.control}
						render={({ field }) => (
							<FormItem className="flex items-center gap-2">
								<FormLabel>URL</FormLabel>
								<FormDescription></FormDescription>
								<Input
									defaultValue={url}
									onChange={(event) => {
										onChange(field.name, event.target.value);
									}}
									type="url"
									placeholder="https://example.com"
								/>
								<FormMessage />
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
									>
										<Trash />
									</Button>
								</div>
							</FormItem>
						)}
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
											return field.onChange(event);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<hr />
				</form>
			</Form>
		</>
	);
};
