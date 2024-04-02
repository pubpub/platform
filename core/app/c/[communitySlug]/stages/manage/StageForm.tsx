import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import * as Icon from "ui/icon";
import { Input } from "ui/input";
import { assert } from "utils";

import { StageFormSchema } from "~/lib/stages";
import { DeepPartial, StagePayload, StagesById } from "~/lib/types";

type Props = {
	stage: StagePayload; // current stage selected for the tab
	sources: StagePayload[]; // list of stages this stage can move to
	onSubmit: (x: DeepPartial<StageFormSchema>) => void; // onSubmit being passed to form
	stages: StagePayload[]; // list of stages under the current workflow
	stagesById: StagesById;
};

type DirtyFields<V extends object> = {
	[K in keyof V]?: V[K] extends object ? DirtyFields<V[K]> : boolean;
};

function dirtyValuesInner<V extends object>(values: V, dirty: DirtyFields<V>, result: Partial<V>) {
	for (const key in dirty) {
		const value = values[key];
		const dirtyValue = dirty[key];
		if (dirtyValue === true) {
			result[key] = value;
		} else {
			assert(dirtyValue !== undefined);
			dirtyValuesInner(value, dirtyValue, (result[key] = {} as V[Extract<keyof V, string>]));
		}
	}
}

/**
 * Create an object that is a subset of the first argument, where entries are
 * only present if the value of the corresponding entry in the second argument
 * is true.
 * @param values The object to filter
 * @param dirty An object with the same shape as `values`, where the values are
 * @example <caption>Include `a` and `c` but not `d`</caption>
 * const values = { a: 1, b: { c: 2, d: 3 } };
 * const dirty = { a: true, b: { c: true } };
 * dirtyValues(values, dirty); // -> { a: 1, b: { c: 2 } }
 */
function dirtyValues<V extends object>(values: V, dirty: DirtyFields<V>): DeepPartial<V> {
	const result: Partial<V> = {};
	dirtyValuesInner(values, dirty, result);
	return result as DeepPartial<V>;
}

export default function StageForm(props: Props) {
	const moveConstraints = Object.values(props.stagesById).reduce(
		(acc, stage) => {
			return {
				...acc,
				[stage.id]: props.stage.moveConstraints.some((toStage) => {
					return toStage.destinationId === stage.id;
				}),
			};
		},
		{} as StageFormSchema["moveConstraints"]
	);

	const form = useForm<StageFormSchema>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			name: props.stage.name || "New Stage",
			moveConstraints: moveConstraints,
		},
	});

	const onSubmit = useCallback(
		async (formData: StageFormSchema) => {
			const patch = dirtyValues(formData, form.formState.dirtyFields);
			props.onSubmit(patch);
		},
		[props.stage, props.onSubmit]
	);

	useEffect(() => {
		form.reset({
			name: props.stage.name || "New Stage",
			moveConstraints: moveConstraints || {},
		});
	}, [props.stage]);
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<div className="flex flex-col p-4">
					<div className="mb-4">
						<p className="text-2xl font-bold">{props.stage.name}</p>
						<p className="text-lg">
							This form contains fields used to edit your surrent stages.
						</p>
					</div>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<div className="mb-4">
									<FormLabel>Stage Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>Name of the stage</FormDescription>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>
					<ul>
						<div className="mb-4">
							<p className="text-base font-bold">Moves to</p>
							<p>These are stages {props.stage.name} can move to</p>
							{Object.values(props.stagesById).map((stage) => {
								return props.stage.id === stage.id ? null : (
									<FormField
										key={stage.id}
										control={form.control}
										name={`moveConstraints.${stage.id}`}
										render={({ field: { value, ...field } }) => {
											return (
												<FormItem
													key={stage.id}
													className="flex flex-row items-start space-x-3 space-y-0"
												>
													<FormControl>
														<input
															type="checkbox"
															id={stage.id}
															{...field}
															defaultChecked={value}
														/>
													</FormControl>
													<FormLabel className="text-sm font-normal">
														{stage.name}
													</FormLabel>
												</FormItem>
											);
										}}
									/>
								);
							})}
							<FormMessage />
						</div>
					</ul>
					<ul className="mb-4">
						<p className="text-base font-bold">Moves from</p>
						<p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
							These are the stages {props.stage.name} can move back from
						</p>
						{props.sources.map((stage) => {
							return (
								<div key={stage.id}>
									<p className="text-blue-500">{stage.name}</p>
								</div>
							);
						})}
					</ul>
					<div className="flex flex-row space-x-4">
						<Button variant="destructive">Delete</Button>
						<Button type="submit" disabled={!form.formState.isValid}>
							Submit
							{form.formState.isSubmitting && (
								<Icon.Loader2 className="ml-4 h-4 w-4 animate-spin" />
							)}
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
