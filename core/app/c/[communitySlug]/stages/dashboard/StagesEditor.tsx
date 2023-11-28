import { useEffect, useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StagePayload } from "~/lib/types";

const schema = z.object({
	stageName: z.string(),
	stageOrder: z.string(),
	stageMoveConstraints: z.array(
		z.object({
			id: z.string(),
			stageId: z.string(),
			destinationId: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
			destination: z.object({
				id: z.string(),
				name: z.string(),
				order: z.string(),
				communityId: z.string(),
				createdAt: z.date(),
				updatedAt: z.date(),
			}),
		})
	),
});

type Props = {
	stages: StagePayload[];
};

const StagesEditor = (props: Props) => {
	const [selectedStage, setSelectedStage] = useState(props.stages[0]); // Set the initial selected stage.
	const sources = selectedStage.moveConstraintSources.map(
		(stage) => props.stages.find((s) => s.id === stage.stageId)!
	);
	const handleStageChange = (newStage: StagePayload) => {
		setSelectedStage(newStage);
	};

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			stageName: selectedStage.name,
			stageOrder: selectedStage.order,
			stageMoveConstraints: selectedStage.moveConstraints,
		},
	});
	useEffect(() => {
		form.reset({
			stageName: selectedStage.name,
			stageOrder: selectedStage.order,
			stageMoveConstraints: selectedStage.moveConstraints,
		});
	}, [selectedStage]);

	const onSubmit = async (data: z.infer<typeof schema>) => {
		console.log(data);
	};

	return (
		<div className="flex flex-col space-x-4">
			<div>
				{/* Display a list of stages as tabs */}
				<div className="space-y-2">
					{props.stages.map((stage) => {
						return (
							<button
								key={stage.id}
								className={`px-4 py-2 border ${
									selectedStage.id === stage.id ? "text-white bg-black" : ""
								}`}
								onClick={() => handleStageChange(stage)}
							>
								{stage.name}
							</button>
						);
					})}
				</div>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div>
						{/* Display the selected stage for editing */}
						<div className="p-4">
							<Card>
								<CardHeader>
									<CardTitle>{selectedStage.name} Stage Settings</CardTitle>
									<CardDescription>
										This form contains fields used to edit your surrent stages.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<FormField
										control={form.control}
										name="stageName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Stage Name</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormDescription>Name of the stage</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
								<CardContent>
									<FormField
										control={form.control}
										name="stageOrder"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Stage Order</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormDescription>Name of the stage</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
								<CardContent>
									<FormField
										control={form.control}
										name="stageMoveConstraints"
										render={() => (
											<FormItem>
												<div className="mb-4">
													<FormLabel className="text-base">
														Moves to
													</FormLabel>
													<FormDescription>
														These are stages {selectedStage.name}{" "}
														can move to
													</FormDescription>
												</div>
												{selectedStage.moveConstraints.map((stage) => {
													return selectedStage.id === stage.id ? null : (
														<FormField
															key={stage.id}
															control={form.control}
															name="stageMoveConstraints"
															render={({ field }) => {
																console.log(
																	selectedStage.moveConstraints.some(
																		(constraint) =>
																			field.value.includes(
																				constraint
																			)
																	)
																);
																console.log(
																	field.value?.some(
																		(constarint) =>
																			selectedStage.moveConstraints.includes(
																				constarint
																			)
																	)
																);
																return (
																	<FormItem
																		key={stage.id}
																		className="flex flex-row items-start space-x-3 space-y-0"
																	>
																		<FormControl>
																			<input type="checkbox"
																				id={stage.id}
																				checked={false}
																			/>
																		</FormControl>
																		<FormLabel className="text-sm font-normal">
																			{stage.destination.name}
																		</FormLabel>
																	</FormItem>
																);
															}}
														/>
													);
												})}
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
								<CardContent>
									<section>Moves from</section>
									<section className="text-[0.8rem] text-slate-500 dark:text-slate-400">
										These are the stages {selectedStage.name} can move back from
									</section>
									{sources.map((stage) => {
										return (
											<div key={stage.id}>
												<section
													className="text-blue-500"
													onClick={() => handleStageChange(stage)}
												>
													{stage.name}
												</section>
											</div>
										);
									})}
								</CardContent>
								<CardFooter>
									<div className="flex flex-row space-x-4">
										<Button variant="destructive">Delete</Button>
										<Button type="submit" disabled={!form.formState.isValid}>
											Submit
											{form.formState.isSubmitting && (
												<Icon.Loader2 className="h-4 w-4 ml-4 animate-spin" />
											)}
										</Button>
									</div>
								</CardFooter>
							</Card>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default StagesEditor;
