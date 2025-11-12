import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { MultiSelect } from "ui/multi-select";
import { usePubTypeContext } from "ui/pubTypes";

import type { ComponentConfigFormProps } from "./types";

export default ({ form }: ComponentConfigFormProps<InputComponent.relationBlock>) => {
	const pubTypes = usePubTypeContext();

	return (
		<>
			<FormField
				control={form.control}
				name="config.relationshipConfig.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input
								placeholder="Description of the selection"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.relationshipConfig.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Help Text</FormLabel>
						<FormControl>
							<Input
								placeholder="Optional additional guidance"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormDescription>Appears below the field</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="relatedPubTypes"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Pub Type</FormLabel>
						<MultiSelect
							className="bg-white"
							options={pubTypes.map((pubType) => ({
								value: pubType.id,
								label: pubType.name,
								node: (
									<span className="rounded-sm border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-xs text-blue-400">
										{pubType.name}
									</span>
								),
							}))}
							placeholder="Select a Pub Type"
							onValueChange={(value) => field.onChange(value)}
							animation={0}
							badgeClassName="bg-blue-200 text-blue-400 rounded-sm font-mono font-normal border border-blue-400 whitespace-nowrap"
							defaultValue={field.value ?? []}
							data-testid="related-pub-type-selector"
						/>
						<FormDescription>
							Select the Types of Pubs that can be related through this field (min 1).
							<br />
							<strong>NOTE:</strong> Anyone with access to this form will be able to
							see <em>every</em> Pubs of the selected types!
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
