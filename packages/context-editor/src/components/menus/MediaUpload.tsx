import type { Static } from "@sinclair/typebox";
import type { Attrs } from "prosemirror-model";

import React, { useMemo } from "react";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useForm } from "react-hook-form";

import { Form } from "ui/form";
import { ExternalLink, HelpCircle } from "ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { AdvancedOptions } from "./AdvancedOptions";
import { MenuInputField, MenuSwitchField } from "./MenuFields";

const formSchema = Type.Object({
	src: Type.String(),
	alt: Type.String(),
	linkTo: Type.String({ format: "uri" }),
	credit: Type.String(),
	license: Type.String(),
	width: Type.Number(),
	align: Type.String(), // make enum?
	id: Type.String(),
	class: Type.String(),
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

export const MediaUpload = ({ attrs }: { attrs: Attrs }) => {
	const resolver = useMemo(() => typeboxResolver(compiledSchema), []);

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			src: attrs.src ?? "",
			alt: attrs.alt ?? "",
			id: attrs.id ?? "",
			class: attrs.class ?? "",
			linkTo: attrs.linkTo ?? "",
			credit: attrs.credit ?? "",
			license: attrs.license ?? "",
			width: attrs.width ?? 100,
			align: attrs.align ?? "center",
		},
	});

	return (
		<Form {...form}>
			<form>
				<h2 className="text-md font-medium">Media Attributes</h2>
				<Tabs defaultValue="info" className="bg-muted">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="info">Info</TabsTrigger>
						<TabsTrigger value="style">Style</TabsTrigger>
					</TabsList>
					<TabsContent value="info" className="flex flex-col space-y-4">
						{/* TODO: make toggle into edit field, download */}
						<MenuInputField name="src" label="Source" />
						<MenuInputField
							name="alt"
							label="Alt text"
							right={() => (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger>
											<HelpCircle
												strokeWidth="1px"
												className="text-gray-500"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Describe what the image shows for vision-impaired users.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						/>
						<MenuInputField
							name="linkTo"
							label="Link to"
							right={(value) =>
								value.length ? (
									<a href={value} target="_blank">
										<ExternalLink strokeWidth="1px" className="text-gray-500" />
									</a>
								) : (
									<ExternalLink strokeWidth="1px" className="text-gray-300" />
								)
							}
						/>
						<hr />
						<MenuSwitchField name="caption" label="Caption" />
						<MenuSwitchField name="credit" label="Credit" />
						<MenuSwitchField name="license" label="License" />
						<hr />
						<AdvancedOptions />
					</TabsContent>
					<TabsContent value="style">2</TabsContent>
				</Tabs>
			</form>
		</Form>
	);
};
