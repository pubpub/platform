"use client";

import { useFormContext } from "react-hook-form";

import { FormDescription, FormField, FormItem, FormLabel } from "ui/form";

import { ConditionBlock } from "./ConditionBlock";

type ConditionsBuilderProps = {
	slug: string;
};

export const ConditionsBuilder = ({ slug }: ConditionsBuilderProps) => {
	const { control, watch } = useFormContext();
	const hasConditions = watch(slug);

	if (!hasConditions) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={() => (
				<FormItem className="space-y-2">
					<FormLabel>Conditions (optional)</FormLabel>
					<FormDescription>
						Define conditions that must be met for this automation to run. Use JSONata
						expressions to construct a boolean value like{" "}
						<code>'Hello' in $.pub.values.title</code>.
					</FormDescription>
					<ConditionBlock slug={slug} id={"root-block"} />
				</FormItem>
			)}
		/>
	);
};
