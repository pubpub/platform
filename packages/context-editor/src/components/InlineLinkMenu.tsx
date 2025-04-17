import type { Static } from "@sinclair/typebox";

import React from "react";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { usePluginViewContext } from "@prosemirror-adapter/react";
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

import type { PanelProps } from "../ContextEditor";
import { toggleMarkExpandEmpty } from "../commands/marks";
import { attributePanelKey } from "../plugins/attributePanel";
import { baseSchema } from "../schemas";
import { getMarkRange } from "../utils/getMarkRange";

const formSchema = Type.Object({
	href: Type.String(),
	openInNewTab: Type.Boolean({ default: false }),
});

type FormSchema = Static<typeof formSchema>;

type InlineLinkMenuProps = {
	panelProps: PanelProps;
	children?: React.ReactNode;
};
export const InlineLinkMenu = ({ children }: InlineLinkMenuProps) => {
	const { view } = usePluginViewContext();

	const attributePanelPluginState = attributePanelKey.getState(view.state);
	if (!attributePanelPluginState) {
		return null;
	}
	const { panelPosition: panelProps, setPanelPosition: setPanelProps } =
		attributePanelPluginState;

	const { node, pos } = panelProps;
	if (!node) {
		return null;
	}

	const removeLink = () =>
		toggleMarkExpandEmpty({
			state: view.state,
			dispatch: view.dispatch,
			type: baseSchema.marks.link,
		});

	const form = useForm<FormSchema>({
		resolver: typeboxResolver(formSchema),
		defaultValues: {
			href: node?.attrs?.href,
			openInNewTab: node?.attrs?.target === "_blank",
		},
	});

	const updateLinkAttr = (attrKey: "href" | "target", value: string | null) => {
		const range = getMarkRange(view.state.doc.resolve(pos), baseSchema.marks.link);
		if (!range) {
			return;
		}
		const { from: markStart, to: markEnd } = range;

		const oldMarks = node.marks || [];
		const oldMark = oldMarks.find((m) => m.type === baseSchema.marks.link);

		if (!oldMark) {
			return null;
		}

		const newMark = baseSchema.marks.link.create({
			...oldMark.attrs,
			[attrKey]: value,
		});
		setPanelProps({
			...panelProps,
			node: {
				...node,
				marks: [...oldMarks.filter((m) => m.type !== baseSchema.marks.link), newMark],
			},
		});
		view.dispatch(
			view.state.tr
				.removeMark(markStart, markEnd, oldMark)
				.addMark(markStart, markEnd, newMark)
		);
	};

	return (
		<
			// div
			// style={{
			// 	top: coords.top,
			// 	left: coords.left,
			// }}
			// className="absolute rounded-md border border-gray-200 bg-white p-3"
		>
			<div>Link Attributes</div>
			<Form {...form}>
				<form className="flex flex-col gap-2">
					<FormField
						name="href"
						control={form.control}
						render={({ field }) => (
							<FormItem className="flex items-center gap-1">
								<FormLabel>URL</FormLabel>
								<FormDescription></FormDescription>
								<Input
									{...field}
									onChange={(event) => {
										updateLinkAttr(field.name, field.value);
										return field.onChange(event);
									}}
									type="url"
									placeholder="https://example.com"
								/>
								<FormMessage />
								<a href={field.value} target="_blank">
									<ExternalLink />
								</a>
								<Button onClick={removeLink}>
									<Trash />
								</Button>
							</FormItem>
						)}
					/>
					<hr />
					<FormField
						name="openInNewTab"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Open in new tab</FormLabel>
								<FormControl>
									<Switch
										className="data-[state=checked]:bg-emerald-400"
										checked={field.value ?? undefined}
										onCheckedChange={(event) => {
											updateLinkAttr("target", field.value ? "_blank" : null);
											return field.onChange(event);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<hr />
					{children}
				</form>
			</Form>
		</
			// div
		>
	);
};
