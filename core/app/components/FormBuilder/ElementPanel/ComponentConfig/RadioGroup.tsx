import { Checkbox } from "ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { InnerFormProps } from "./types";
import MultivalueBase from "./MultivalueBase";

export default (props: InnerFormProps) => {
	const { form } = props;
	return (
		<MultivalueBase {...props} label="Radio">
			<FormField
				control={form.control}
				name="config.includeOther"
				render={({ field }) => (
					<FormItem className="mt-2">
						<div className="flex items-end gap-x-2">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<FormLabel>Allow selection of 'Other' with custom string</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</MultivalueBase>
	);
};
