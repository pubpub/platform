import type { Static } from "@sinclair/typebox";
import type { Attrs } from "prosemirror-model";
import type { ReactNode } from "react";

import React, { useMemo } from "react";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useForm } from "react-hook-form";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	AlignVerticalSpaceAround,
	Expand,
	ExternalLink,
	HelpCircle,
} from "ui/icon";
import { Input } from "ui/input";
import { RadioGroup, RadioGroupCard } from "ui/radio-group";
import { Slider } from "ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { Alignment } from "../../schemas/image";
import { AdvancedOptions } from "./AdvancedOptions";
import { MenuInputField, MenuSwitchField } from "./MenuFields";

const formSchema = Type.Object({
	src: Type.String(),
	alt: Type.String(),
	linkTo: Type.String({ format: "uri" }),
	credit: Type.String(),
	license: Type.String(),
	width: Type.Number(),
	align: Type.Enum(Alignment),
	id: Type.String(),
	class: Type.String(),
});

const compiledSchema = TypeCompiler.Compile(formSchema);

type FormSchema = Static<typeof formSchema>;

const ALIGNMENT_INFO: Record<Alignment, { icon: ReactNode; label: string }> = {
	[Alignment.left]: { icon: <AlignLeft />, label: "Align left" },
	[Alignment.center]: { icon: <AlignCenter />, label: "Align center" },
	[Alignment.right]: { icon: <AlignRight />, label: "Align right" },
	[Alignment.verticalCenter]: { icon: <AlignVerticalSpaceAround />, label: "Vertically center" },
	[Alignment.expand]: { icon: <Expand />, label: "Expand" },
};

const AlignmentRadioItem = ({ alignment }: { alignment: Alignment }) => {
	const { icon, label } = ALIGNMENT_INFO[alignment];
	return (
		<FormItem>
			<FormControl>
				<RadioGroupCard
					value={alignment}
					className="data-[state=checked]:border-ring-0 rounded border-0 data-[state=checked]:bg-gray-200"
				>
					{icon}
				</RadioGroupCard>
			</FormControl>
			<FormLabel className="sr-only">{label}</FormLabel>
		</FormItem>
	);
};

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
				<Tabs defaultValue="info">
					<TabsList className="grid w-full grid-cols-2 bg-muted">
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
					<TabsContent value="style" className="space-y-4">
						<FormField
							control={form.control}
							name="width"
							render={({ field }) => {
								return (
									<FormItem>
										<div className="grid grid-cols-4 items-center gap-1">
											<FormLabel>Width</FormLabel>
											<div className="display col-span-3 flex items-center gap-1">
												<FormControl>
													<Slider
														defaultValue={[100]}
														value={
															field.value == null
																? undefined
																: [field.value]
														}
														onValueChange={(value) =>
															field.onChange(value[0])
														}
														min={0}
														max={100}
														step={1}
													/>
												</FormControl>
												<FormControl>
													<div className="flex items-center gap-1">
														<Input
															type="number"
															{...field}
															onChange={(e) => {
																field.onChange(
																	e.target.valueAsNumber
																);
															}}
														/>
														%
													</div>
												</FormControl>
											</div>
										</div>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="align"
							render={({ field }) => {
								return (
									<FormItem>
										<div className="grid grid-cols-4 items-center gap-1">
											<FormLabel>Alignment</FormLabel>
											<div className="display col-span-3 flex items-center">
												<FormControl>
													<RadioGroup
														onValueChange={field.onChange}
														defaultValue={field.value}
														className="flex w-full items-center justify-end gap-2"
													>
														<AlignmentRadioItem
															alignment={Alignment.left}
														/>
														<AlignmentRadioItem
															alignment={Alignment.center}
														/>
														<AlignmentRadioItem
															alignment={Alignment.right}
														/>
														<AlignmentRadioItem
															alignment={Alignment.verticalCenter}
														/>
														<AlignmentRadioItem
															alignment={Alignment.expand}
														/>
													</RadioGroup>
												</FormControl>
											</div>
										</div>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<hr />
						<MenuSwitchField name="fullResolution" label="Always use full resolution" />
					</TabsContent>
				</Tabs>
			</form>
		</Form>
	);
};
