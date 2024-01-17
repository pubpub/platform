import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
} from "ui";
import * as z from "zod";
import { stageFormSchema } from "~/lib/stages";
import { StagePayload } from "~/lib/types";

type Props = {
	stage: StagePayload;
	sources: any;
	onSubmit: (x: any) => void;
	stages: StagePayload[];
};

// Map RHF's dirtyFields over the `data` received by `handleSubmit` and return the changed subset of that data.
export function dirtyValues(dirtyFields: object | boolean, allValues: object): object {
	// If *any* item in an array was modified, the entire array must be submitted, because there's no way to indicate
	// "placeholders" for unchanged elements. `dirtyFields` is `true` for leaves.
	if (dirtyFields === true || Array.isArray(dirtyFields)) return allValues;
	// Here, we have an object
	return Object.fromEntries(
		Object.keys(dirtyFields).map((key) => [key, dirtyValues(dirtyFields[key], allValues[key])])
	);
}

export default function StageForm(props: Props) {
	const moveConstraints = props.stages.reduce((acc, stage) => {
		return {
			...acc,
			[stage.id]: props.stage.moveConstraints.some((toStage) => {
				return toStage.destinationId === stage.id;
			}),
		};
	}, {});

	const form = useForm<z.infer<typeof stageFormSchema>>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			name: props.stage.name || "New Stage",
			moveConstraints: moveConstraints || {},
		},
	});

	const onSubmit = useCallback(
		async (formData) => {
			const patch = dirtyValues(form.formState.dirtyFields, formData);
			// const stageUpdateData = {
			// 	stage: props.stage,
			// 	newName: formData.name,
			// 	newMoveConstraints: formData.moveConstraints,
			// };
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
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				// onChange={(e) => {
				// 	e.preventDefault();
				// 	console.log(form.formState.dirtyFields);
				// }}
			>
				<div className="p-4 flex flex-col">
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
							{props.stages.map((stage) => {
								return props.stage.id === stage.id ? null : (
									<FormField
										key={stage.id}
										control={form.control}
										name={`moveConstraints.${stage.id}`}
										render={({ field }) => {
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
															defaultChecked={field.value}
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
								<Icon.Loader2 className="h-4 w-4 ml-4 animate-spin" />
							)}
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
