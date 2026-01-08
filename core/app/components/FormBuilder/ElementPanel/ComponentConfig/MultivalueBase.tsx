import type { ReactNode } from "react"
import type { ComponentConfigFormProps } from "./types"

import { CoreSchemaType, type InputComponent } from "db/public"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"
import { MultiValueInput } from "ui/multivalue-input"

export default ({
	form,
	schemaName,
	label,
	children,
}: ComponentConfigFormProps<InputComponent.selectDropdown> & {
	label: string
	children?: ReactNode
}) => {
	const isNumeric = schemaName === CoreSchemaType.NumericArray
	return (
		<div className="flex flex-col gap-6">
			<FormField
				control={form.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input placeholder="Description of the selection" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Input placeholder="Optional additional guidance" {...field} />
						</FormControl>
						<FormDescription>Appears below the label</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.values"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{label} Values</FormLabel>
						<FormControl>
							<MultiValueInput
								defaultValue={""}
								type={isNumeric ? "number" : undefined}
								onChange={(e: string[]) => {
									if (isNumeric) {
										return field.onChange(e.map((v) => +v))
									}
									field.onChange(e)
								}}
								value={field.value ? field.value.map((v) => `${v}`) : []}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			{children}
		</div>
	)
}
