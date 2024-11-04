"use client";

import type { Stages } from "db/public";
import { FormField, FormItem, FormLabel } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

type Props = {
	fieldLabel: string;
	fieldName: string;
	stage?: Stages;
	stages: Stages[];
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
						value={props.stage?.id}
						onValueChange={(value) => {
							field.onChange(value);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a stage" defaultValue={field.value}>
								{props.stages.find((stage) => stage.id === field.value)?.name}
							</SelectValue>
						</SelectTrigger>
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
