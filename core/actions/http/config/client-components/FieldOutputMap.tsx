"use client";

import { useFieldArray } from "react-hook-form";

import type { PubFieldsId } from "db/public/PubFields";
import type { PubFieldSchemaId } from "db/public/PubFieldSchema";
import { AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion";
import { Button } from "ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ArrowRight, Info, Plus, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Separator } from "ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { defineCustomFormField } from "~/actions/_lib/custom-form-field/defineFormField";
import { action } from "../../action";

type PubField = {
	id: PubFieldsId;
	name: string;
	slug: string;
	pubFieldSchemaId: PubFieldSchemaId | null;
};

const OutputMapField = ({
	unselectedPubFields,
	fieldName,
}: {
	unselectedPubFields: PubField[];
	fieldName: string;
}) => (
	<TooltipProvider>
		<div className="flex items-start gap-x-2 overflow-visible">
			<FormField
				name={`${fieldName}.responseField`}
				render={({ field }) => (
					<FormItem className="flex w-1/2 flex-col gap-y-1">
						<FormLabel className="flex items-center gap-x-2 text-sm font-normal text-gray-700">
							<span>Response field</span>
							<Tooltip>
								<TooltipTrigger>
									<Info size="12" />
								</TooltipTrigger>
								<TooltipContent className="prose max-w-sm text-xs">
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
						</FormLabel>
						<Input {...field} className="font-mono" />
						<FormMessage />
					</FormItem>
				)}
			/>
			<ArrowRight className="mt-10 h-4 w-4" />
			<FormField
				name={`${fieldName}.pubField`}
				render={({ field }) => {
					return (
						<FormItem className="flex w-1/2 flex-col gap-y-1">
							<FormLabel className="flex items-center gap-x-2 text-sm font-normal text-gray-700">
								<span> Pub field</span>

								<Tooltip>
									<TooltipTrigger>
										<Info size="12" />
									</TooltipTrigger>
									<TooltipContent className="prose max-w-sm text-xs">
										The pub field to overwrite with the specified field of the
										response.{" "}
										<ul>
											<li>
												When configuring the action, you can select any pub
												field that is used in your community.{" "}
											</li>
											<li>
												When running the action manually, only the pub
												fields on the pub are available to select.
											</li>
										</ul>
									</TooltipContent>
								</Tooltip>
							</FormLabel>
							<FormControl>
								<Select onValueChange={field.onChange} {...field}>
									<SelectTrigger>
										<SelectValue placeholder="Select a field">
											{/* without the {" "} the field.value sometimes doesn't render, weird */}
											{field.value}{" "}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{unselectedPubFields.map(({ name, slug }) => (
											<SelectItem value={slug} key={name}>
												{slug}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					);
				}}
			/>
		</div>
	</TooltipProvider>
);

export const FieldOutputMap = defineCustomFormField(
	action,
	"config",
	"outputMap",
	function FieldOutputMap(
		{ form, fieldName },
		context: {
			pubFields: PubField[];
		}
	) {
		const pubFields = context.pubFields;
		const values = form.watch();

		const { fields, append, remove } = useFieldArray({
			control: form.control,
			name: fieldName,
		});
		const itemName = "Output Map";

		const [title] = itemName.split("|");

		const alreadySelectedPubFields = values[fieldName] ?? [];
		const unselectedPubFields = pubFields.filter(
			(pubField) =>
				!alreadySelectedPubFields.some((field) => field.pubField === pubField.slug)
		);

		return (
			<AccordionItem value={"a"} className="border-none">
				<AccordionTrigger>{title}</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-y-4">
					<p className="text-sm text-zinc-500">
						Maps the response field to the specified pub fields.
					</p>
					{alreadySelectedPubFields.map((_field, index) => {
						return (
							<div className="flex flex-col gap-y-2" key={`outputMap.${index}`}>
								<FormField
									name={`outputMap.[${index}]`}
									render={() => {
										return (
											<FormItem
												className="flex flex-col gap-y-2"
												key={`outputMap.${index}`}
											>
												<OutputMapField
													unselectedPubFields={unselectedPubFields}
													fieldName={`outputMap.[${index}]`}
												/>
											</FormItem>
										);
									}}
								/>
								<div className="flex justify-end">
									<Button
										variant="secondary"
										size="icon"
										type="button"
										className="hover:bg-zinc-300 hover:text-black focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white dark:text-black dark:hover:bg-zinc-300 dark:hover:text-black dark:hover:ring-0 dark:hover:ring-offset-0 dark:focus-visible:ring-0 dark:focus-visible:ring-offset-0"
										onClick={() => remove(index)}
									>
										<Trash size="12" />
									</Button>
								</div>

								<Separator />
							</div>
						);
					})}
					{fields.length !== pubFields.length && (
						<Button
							type="button"
							variant="secondary"
							onClick={() => append({} as any)}
							className="mt-4 flex items-center"
						>
							<Plus className="mr-2" size={16} />
							Add
						</Button>
					)}
				</AccordionContent>
			</AccordionItem>
		);
	}
);

export default FieldOutputMap;
