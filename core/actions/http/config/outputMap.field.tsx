"use client";

import { title } from "process";

import { remove } from "diacritics";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Plus, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Separator } from "ui/separator";

import type { PubField } from "./context";
import { defineCustomFormField } from "~/actions/_lib/defineFormField";
import { useActionContext } from "~/actions/_lib/useActionContext";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../../../../packages/ui/src/accordion";
import { action } from "../action";

const OutputMapField = ({
	unselectedPubFields,
	fieldName,
}: {
	unselectedPubFields: PubField[];
	fieldName: string;
}) => (
	<div className="flex gap-x-2">
		<FormField
			name={`${fieldName}.pubField`}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
							{...field}
						>
							<SelectTrigger>
								<SelectValue>{field.value || "Select an option"}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{unselectedPubFields.map(({ name, slug }) => (
									<SelectItem value={slug} key={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormControl>
				</FormItem>
			)}
		/>
		<FormField
			name={`${fieldName}.responseField`}
			render={({ field }) => (
				<FormItem className="flex flex-col gap-y-2">
					<Input {...field} />
					<FormMessage />
				</FormItem>
			)}
		/>
	</div>
);

export const Thingy = defineCustomFormField(
	action,
	"config",
	"outputMap",
	({ pubFields, form }: { pubFields: { id: string; slug: string; name: string }[] }) => {
		const values = form.watch();

		const name = "outputMap";

		const { fields, append, remove } = useFieldArray({
			control: form.control,
			name,
		});
		const itemName = "Output Map";

		const [title, description, additionalType] = itemName.split("|");

		const alreadySelectedPubFields = values[name] ?? [];
		const unselectedPubFields = pubFields.filter(
			(pubField) =>
				!alreadySelectedPubFields.some((field) => field.pubField === pubField.slug)
		);
		console.log({ outputmap: values.outputMap });

		return (
			<AccordionItem value={"a"} className="border-none">
				<AccordionTrigger>{title}</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-y-4">
					{alreadySelectedPubFields.map((_field, index) => {
						return (
							<div className="flex flex-col gap-y-2" key={`outputMap.${index}`}>
								<FormField
									name={`outputMap.[${index}]`}
									render={({ field, formState }) => {
										return (
											<div>
												<FormItem className="flex flex-col gap-y-2">
													{/* <FormLabel>{field.name}</FormLabel>
												<FormDescription>{}</FormDescription> */}
													<OutputMapField
														unselectedPubFields={unselectedPubFields}
														fieldName={`outputMap.[${index}]`}
													/>
													{/* <FormMessage /> */}
												</FormItem>
											</div>
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
							onClick={() => append({})}
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

export default Thingy;
