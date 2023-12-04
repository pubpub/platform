import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "ui";
import * as z from "zod";
import { stageSources } from "~/lib/pubStages";
import { StageIndex, StagePayload } from "~/lib/types";

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
	stageWorkflows: StagePayload[][];
	stageIndex: StageIndex;
};

const StagesEditor = (props: Props) => {
	const [selectedStage, setSelectedStage] = useState(props.stageWorkflows[0][0]); // Set the initial selected stage.
	const sources = stageSources(selectedStage, props.stageIndex);
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
		<div className="space-x-4">
			{
				props.stageWorkflows.map((stages) => {
					return (
						<div className="space-y-2">
							<Tabs defaultValue={selectedStage.id}>
								{stages.map((stage) => {
									return (
										<TabsList key={stage.id}>
											<TabsTrigger
												value={stage.id}
												onClick={() => handleStageChange(stage)}
											>
												{stage.name}
											</TabsTrigger>
										</TabsList>
									);
								})}
								{stages.map((stage) => {
									return (
										<TabsContent value={stage.id} key={stage.id}>
											<Form {...form}>
												<form onSubmit={form.handleSubmit(onSubmit)}>
													<div className="p-4 flex flex-col">
														<div className="mb-4">
															<p className="text-2xl font-bold">
																{selectedStage.name}
															</p>
															<p className="text-lg">
																Stage Settings This form contains
																fields used to edit your surrent
																stages.
															</p>
														</div>
														<FormField
															control={form.control}
															name="stageName"
															render={({ field }) => (
																<FormItem>
																	<div className="mb-4">
																		<FormLabel>
																			Stage Name
																		</FormLabel>
																		<FormControl>
																			<Input {...field} />
																		</FormControl>
																		<FormDescription>
																			Name of the stage
																		</FormDescription>
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
																		<FormLabel>
																			Stage Order
																		</FormLabel>
																		<FormControl>
																			<Input {...field} />
																		</FormControl>
																		<FormDescription>
																			Stage order
																		</FormDescription>
																		<FormMessage />
																	</div>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name="stageMoveConstraints"
															render={() => (
																<FormItem>
																	<div className="mb-4">
																		<FormLabel className="text-base font-bold">
																			Moves to
																		</FormLabel>
																		<FormDescription>
																			These are stages{" "}
																			{selectedStage.name} can
																			move to
																		</FormDescription>

																		{selectedStage.moveConstraints.map(
																			(stage) => {
																				return selectedStage.id ===
																					stage.id ? null : (
																					<FormField
																						key={
																							stage.id
																						}
																						control={
																							form.control
																						}
																						name="stageMoveConstraints"
																						render={({
																							field,
																						}) => {
																							console.log(
																								selectedStage.moveConstraints.some(
																									(
																										constraint
																									) =>
																										field.value.includes(
																											constraint
																										)
																								)
																							);
																							console.log(
																								field.value?.some(
																									(
																										constarint
																									) =>
																										selectedStage.moveConstraints.includes(
																											constarint
																										)
																								)
																							);
																							return (
																								<FormItem
																									key={
																										stage.id
																									}
																									className="flex flex-row items-start space-x-3 space-y-0"
																								>
																									<FormControl>
																										<input
																											type="checkbox"
																											id={
																												stage.id
																											}
																											checked={
																												false
																											}
																										/>
																									</FormControl>
																									<FormLabel className="text-sm font-normal">
																										{
																											stage
																												.destination
																												.name
																										}
																									</FormLabel>
																								</FormItem>
																							);
																						}}
																					/>
																				);
																			}
																		)}
																		<FormMessage />
																	</div>
																</FormItem>
															)}
														/>
														<div className="mb-4">
															<p className="text-base font-bold">
																Moves from
															</p>
															<p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
																These are the stages{" "}
																{selectedStage.name} can move back
																from
															</p>
															{sources.map((stage) => {
																return (
																	<div key={stage.id}>
																		<p
																			onClick={() =>
																				handleStageChange(
																					stage
																				)
																			}
																			className="text-blue-500"
																		>
																			{stage.name}
																		</p>
																	</div>
																);
															})}
														</div>
														<div className="flex flex-row space-x-4">
															<Button variant="destructive">
																Delete
															</Button>
															<Button
																type="submit"
																disabled={!form.formState.isValid}
															>
																Submit
																{form.formState.isSubmitting && (
																	<Icon.Loader2 className="h-4 w-4 ml-4 animate-spin" />
																)}
															</Button>
														</div>
													</div>
												</form>
											</Form>
										</TabsContent>
									);
								})}
							</Tabs>
						</div>
					);
				})[0]
			}
		</div>
	);
};

export default StagesEditor;
