import type { useForm } from "react-hook-form"
import type * as z from "zod"

import * as React from "react"
import { Plus, Trash } from "lucide-react"
import { useFieldArray } from "react-hook-form"

import { AccordionContent, AccordionItem, AccordionTrigger } from "../../accordion"
import { Button } from "../../button"
import { Separator } from "../../separator"
import { beautifyObjectName } from "../utils"
import AutoFormObject from "./object"

function isZodArray(item: z.ZodArray<any> | z.ZodDefault<any>): item is z.ZodArray<any> {
	return item._def.typeName === "ZodArray"
}

function isZodDefaultOrOptional<Z extends z.ZodArray<any> | z.ZodDefault<any> | z.ZodOptional<any>>(
	item: Z
): item is Exclude<Z, z.ZodArray<any>> {
	return item._def.typeName === "ZodDefault" || item._def.typeName === "ZodOptional"
}

export default function AutoFormArray({
	name,
	item,
	form,
	path = [],
	fieldConfig,
}: {
	name: string
	item: z.ZodArray<any> | z.ZodDefault<any>
	form: ReturnType<typeof useForm>
	path?: string[]
	fieldConfig?: any
}) {
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name,
	})
	const itemName = item._def.description ?? beautifyObjectName(name)

	const [title, description, additionalType] = itemName.split("|")

	const itemDefType = isZodArray(item)
		? item._def.type
		: isZodDefaultOrOptional(item)
			? item._def.innerType._def.type
			: null

	return (
		<AccordionItem value={name} className="border-none">
			<AccordionTrigger>{title}</AccordionTrigger>
			<AccordionContent className="flex flex-col gap-y-4">
				{fields.map((_field, index) => {
					const key = _field.id
					return (
						<div className="flex flex-col gap-y-2" key={`${key}`}>
							<AutoFormObject
								schema={itemDefType as z.ZodObject<any, any>}
								form={form}
								fieldConfig={fieldConfig}
								path={[...path, index.toString()]}
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
					)
				})}
				<Button
					type="button"
					variant="secondary"
					onClick={() => append({})}
					className="mt-4 flex items-center"
				>
					<Plus className="mr-2" size={16} />
					Add
				</Button>
			</AccordionContent>
		</AccordionItem>
	)
}
