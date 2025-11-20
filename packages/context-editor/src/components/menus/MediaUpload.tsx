import type { Static } from "@sinclair/typebox"
import type { Node } from "prosemirror-model"

import * as React from "react"
import { useMemo } from "react"
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { useForm } from "react-hook-form"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	AlignVerticalSpaceAround,
	Expand,
	ExternalLink,
	HelpCircle,
} from "ui/icon"
import { Input } from "ui/input"
import { RadioGroup, RadioGroupCard } from "ui/radio-group"
import { Slider } from "ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"

import { Alignment } from "../../schemas/image"
import { MenuInputField, MenuSwitchField } from "./MenuFields"

const formSchema = Type.Object({
	src: Type.String(),
	alt: Type.String(),
	linkTo: Type.String(),
	width: Type.Number(),
	align: Type.Enum(Alignment),
})

const compiledSchema = TypeCompiler.Compile(formSchema)

type FormSchema = Static<typeof formSchema>

const ALIGNMENT_INFO: Record<Alignment, { icon: React.ReactNode; label: string }> = {
	[Alignment.left]: { icon: <AlignLeft />, label: "Align left" },
	[Alignment.center]: { icon: <AlignCenter />, label: "Align center" },
	[Alignment.right]: { icon: <AlignRight />, label: "Align right" },
	[Alignment.verticalCenter]: { icon: <AlignVerticalSpaceAround />, label: "Vertically center" },
	[Alignment.expand]: { icon: <Expand />, label: "Expand" },
}

const AlignmentRadioItem = ({ alignment }: { alignment: Alignment }) => {
	const { icon, label } = ALIGNMENT_INFO[alignment]
	return (
		<FormItem>
			<FormControl>
				<RadioGroupCard
					value={alignment}
					className="rounded border-0 data-[state=checked]:border-ring-0 data-[state=checked]:bg-gray-200"
				>
					{icon}
				</RadioGroupCard>
			</FormControl>
			<FormLabel className="sr-only">{label}</FormLabel>
		</FormItem>
	)
}

type Props = {
	node: Node
	nodePos: number
}

export const MediaUpload = (props: Props) => {
	const { attrs } = props.node
	const resolver = useMemo(() => typeboxResolver(compiledSchema), [])

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			src: attrs.src ?? "",
			alt: attrs.alt ?? "",
			linkTo: attrs.linkTo ?? "",
			width: attrs.width ?? 100,
			align: attrs.align ?? "center",
		},
	})

	const handleSubmit = useEditorEventCallback((view, values: FormSchema) => {
		if (!view) {
			return
		}

		const node = view.state.doc.nodeAt(props.nodePos)

		if (!node) {
			return
		}

		const tr = view.state.tr.setNodeMarkup(
			props.nodePos,
			node.type,
			{ ...node.attrs, ...values },
			node.marks
		)
		view.dispatch(tr)
	})

	return (
		<Form {...form}>
			<form onChange={form.handleSubmit(handleSubmit)}>
				<h2 className="font-medium text-md">Media Attributes</h2>
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
																)
															}}
														/>
														%
													</div>
												</FormControl>
											</div>
										</div>
										<FormMessage />
									</FormItem>
								)
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
								)
							}}
						/>
						<hr />
						<MenuSwitchField name="fullResolution" label="Always use full resolution" />
					</TabsContent>
				</Tabs>
			</form>
		</Form>
	)
}
