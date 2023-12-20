import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { addStageToMoveConstraint, removeStageFromMoveConstraint } from "./actions";

type Props = {
	stage: any;
	sources: any;
	onSubmit: (x: any) => void;
	stages: any;
};

export default function StageForm(props: Props) {
	const stageMoveConstraints = props.stages.reduce((acc, stage) => {
		return {
			...acc,
			[stage.id]: props.stage.moveConstraints.some((toStage) => {
				return toStage.destinationId === stage.id;
			}),
		};
	}, {});
	async function handleAddConstraint(constraint: any) {
		console.log("Add the move constraint ", constraint);
		console.log("to the stage", props.stage);
		const newThing = await addStageToMoveConstraint(constraint, props.stage);
		console.log(newThing);
	}
	async function handleRemoveConstraint(constraint: any) {
		console.log("Remove the move sonstraint", constraint);
		console.log("from the stage", props.stage);
		const newThing = await removeStageFromMoveConstraint(constraint, props.stage);
		console.log(newThing);
	}
	const form = useForm<z.infer<typeof stageFormSchema>>({
		resolver: zodResolver(stageFormSchema),
		defaultValues: {
			stageId: props.stage.id,
			stageName: props.stage.name,
			stageOrder: props.stage.order,
			stageMoveConstraints,
		},
	});
	useEffect(() => {
		form.reset({
			stageId: props.stage.id,
			stageName: props.stage.name,
			stageOrder: props.stage.order,
			stageMoveConstraints,
		});
	}, [props.stage]);
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(props.onSubmit)}>
				<div className="p-4 flex flex-col">
					<div className="mb-4">
						<p className="text-2xl font-bold">{props.stage.name}</p>
						<p className="text-lg">
							Stage Settings This form contains fields used to edit your surrent
							stages.
						</p>
					</div>
					<FormField
						control={form.control}
						name="stageName"
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
					<FormField
						control={form.control}
						name="stageOrder"
						render={({ field }) => (
							<FormItem>
								<div className="mb-4">
									<FormLabel>Stage Order</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormDescription>Stage order</FormDescription>
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
										name={`stageMoveConstraints.${stage.id}`}
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
															onChange={(e) => {
																// field.onChange(e);																console.log(e.target.checked);
																if (e.target.checked) {
																	handleAddConstraint(
																		stage,
																		stageMoveConstraints
																	);
																} else {
																	handleRemoveConstraint(
																		stage,
																		stageMoveConstraints
																	);
																}
															}}
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
									<p
										onClick={() => props.onSubmit(stage)}
										className="text-blue-500"
									>
										{stage.name}
									</p>
								</div>
							);
						})}
					</ul>
					<div className="flex flex-row space-x-4">
						<Button variant="destructive">Delete</Button>
						<Button type="submit">
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
