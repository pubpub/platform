import type { ComponentConfigFormProps, FormType } from "./types"

import { InputComponent } from "db/public"
import { Checkbox } from "ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"

import MultivalueBase from "./MultivalueBase"

export default (props: ComponentConfigFormProps<InputComponent.checkboxGroup>) => {
	const { form, component, ...rest } = props
	return (
		<MultivalueBase
			{...rest}
			component={InputComponent.selectDropdown}
			// Cast to selectDropdown so we can reuse MultivalueBase
			form={form as unknown as FormType<InputComponent.selectDropdown>}
			label="Radio"
		>
			<FormField
				control={form.control}
				name="config.includeOther"
				render={({ field }) => (
					<FormItem className="mt-2">
						<div className="flex items-end gap-x-2">
							<FormControl>
								<Checkbox
									data-testid="include-other"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel>Allow selection of 'Other' with custom string</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</MultivalueBase>
	)
}
