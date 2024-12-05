"use client";

import type { Stages } from "db/public";
import { FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

type Props = {
	fieldLabel: string;
	fieldName: string;
	stages: Pick<Stages, "id" | "name">[];
};

export function StageSelectClient(props: Props) {
	return (
		<FormField
			name={props.fieldName}
			render={({ field }) => (
				<FormItem className="flex flex-col gap-y-1">
					<div className="flex items-center justify-between">
						<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							{props.fieldLabel}
						</FormLabel>
					</div>
					<Select
						{...field}
						onValueChange={(value) => {
							field.onChange(value);
						}}
						defaultValue={field.value}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select a stage" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{props.stages.map((stage) => (
								<SelectItem key={stage.id} value={stage.id}>
									{stage.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FormItem>
			)}
		/>
	);
}
