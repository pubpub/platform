"use client"

import type { PubFieldSchemaId, PubFieldsId } from "db/public"
import type { FieldValues, UseFormReturn } from "react-hook-form"

import React from "react"
import { Accordion } from "@radix-ui/react-accordion"
import { Controller, useFieldArray } from "react-hook-form"

import { AccordionContent, AccordionItem, AccordionTrigger } from "../accordion"
import { Button } from "../button"
import { Field, FieldError, FieldLabel } from "../field"
import { ArrowRight, Info, Plus, Trash } from "../icon"
import { Input } from "../input"
import { usePubFieldContext } from "../pubFields"
import { Separator } from "../separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip"

type PubField = {
	id: PubFieldsId
	name: string
	slug: string
	pubFieldSchemaId: PubFieldSchemaId | null
}

const OutputMapField = ({
	disabled,
	unselectedPubFields,
	form,
	fieldName,
}: {
	disabled?: boolean
	unselectedPubFields: PubField[]
	form: UseFormReturn<
		{
			[K in string]: {
				responseField: string
				pubField: string
			}[]
		},
		unknown,
		FieldValues | undefined
	>
	fieldName: string
}) => (
	<TooltipProvider>
		<div className="flex items-start gap-x-2 overflow-visible">
			<Controller
				control={form.control}
				name={`${fieldName}.responseField`}
				render={({ field, fieldState }) => (
					<Field
						className="flex w-1/2 flex-col gap-y-1"
						data-invalid={fieldState.invalid}
					>
						<FieldLabel
							htmlFor={field.name}
							className="flex items-center gap-x-2 font-normal text-gray-700 text-sm"
						>
							<span>Response field</span>
							<Tooltip>
								<TooltipTrigger>
									<Info size="12" />
								</TooltipTrigger>
								<TooltipContent className="prose dark:prose-invert max-w-sm text-xs">
									You can use{" "}
									<a
										href="https://goessner.net/articles/JsonPath/"
										target="_blank"
										rel="noreferrer"
										className="font-bold underline"
									>
										JSONPath
									</a>{" "}
									syntax to select a field from the JSON body.
								</TooltipContent>
							</Tooltip>
						</FieldLabel>
						<Input
							{...field}
							id={field.name}
							disabled={disabled}
							aria-disabled={disabled}
							className="font-mono"
						/>
						<FieldError errors={[fieldState.error]} />
					</Field>
				)}
			/>
			<ArrowRight className="mt-10 h-4 w-4" />
			<Controller
				name={`${fieldName}.pubField`}
				render={({ field, fieldState }) => {
					return (
						<Field
							className="flex w-1/2 flex-col gap-y-1"
							data-invalid={fieldState.invalid}
						>
							<FieldLabel
								htmlFor={field.name}
								className="flex items-center gap-x-2 font-normal text-gray-700 text-sm"
							>
								<span> Pub field</span>

								<Tooltip>
									<TooltipTrigger>
										<Info size="12" />
									</TooltipTrigger>
									<TooltipContent className="prose dark:prose-invert max-w-sm text-xs">
										The pub field to overwrite with the specified field of the
										response.{" "}
										<ul>
											<li>
												When configuring the action, you can select any pub
												field that is used in your community.{" "}
											</li>
										</ul>
									</TooltipContent>
								</Tooltip>
							</FieldLabel>
							<Input
								{...field}
								id={field.name}
								disabled={disabled}
								aria-disabled={disabled}
								className="font-mono"
							/>
							<FieldError errors={[fieldState.error]} />
						</Field>
					)
				}}
			/>
		</div>
	</TooltipProvider>
)

export const FieldOutputMap = <F extends string>({
	disabled,
	form,
	fieldName,
}: {
	disabled?: boolean
	form: UseFormReturn<
		{
			[K in F]: {
				responseField: string
				pubField: string
			}[]
		},
		unknown,
		FieldValues | undefined
	>
	fieldName: F
}) => {
	const pubFields = Object.values(usePubFieldContext())
	const values = form.watch()

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		// @ts-expect-error this is correct, but typescript isn't able to determine that the `F` in the fieldName is the same F as in the form
		name: fieldName,
	})
	const itemName = "Output Map"

	const [title] = itemName.split("|")

	const alreadySelectedPubFields = values[fieldName] ?? []

	const unselectedPubFields = pubFields.filter(
		(pubField) => !alreadySelectedPubFields.some((field) => field.pubField === pubField.slug)
	)

	return (
		<Accordion type="multiple" className="space-y-5 border-none" disabled={disabled}>
			<AccordionItem value={"a"} className="border-none">
				<AccordionTrigger>{title}</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-y-4">
					<p className="text-sm text-zinc-500">
						Maps the response field to the specified pub fields.
					</p>
					{alreadySelectedPubFields.map((_field, index) => {
						return (
							<div className="flex flex-col gap-y-2" key={`outputMap.${index}`}>
								<Controller
									name={`outputMap.[${index}]`}
									render={({ field }) => {
										return (
											<OutputMapField
												form={form as any}
												disabled={disabled}
												unselectedPubFields={unselectedPubFields}
												fieldName={`outputMap.[${index}]`}
											/>
										)
									}}
								/>
								<div className="flex justify-end">
									<Button
										variant="secondary"
										size="icon"
										type="button"
										disabled={disabled}
										className="hover:bg-zinc-300 hover:text-black focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white dark:text-black dark:focus-visible:ring-0 dark:focus-visible:ring-offset-0 dark:hover:bg-zinc-300 dark:hover:text-black dark:hover:ring-0 dark:hover:ring-offset-0"
										onClick={() => remove(index)}
									>
										<Trash size="12" />
									</Button>
								</div>

								<Separator />
							</div>
						)
					})}
					{fields.length !== pubFields.length && (
						<Button
							type="button"
							variant="secondary"
							disabled={disabled}
							onClick={() => append({} as any)}
							className="mt-4 flex items-center"
						>
							<Plus className="mr-2" size={16} />
							Add
						</Button>
					)}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}

export default FieldOutputMap
