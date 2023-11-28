import { useEffect, useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	useToast,
} from "ui";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StagePayload } from "~/lib/types";
import { Check } from "ui/src/icon";

const items = [
	{
		id: "recents",
		label: "Recents",
	},
	{
		id: "home",
		label: "Home",
	},
	{
		id: "applications",
		label: "Applications",
	},
	{
		id: "desktop",
		label: "Desktop",
	},
	{
		id: "downloads",
		label: "Downloads",
	},
	{
		id: "documents",
		label: "Documents",
	},
] as const;

const schema = z.object({
	stageName: z.string(),
	stageOrder: z.string(),
	items: z.array(z.string()).refine((value) => value.some((item) => item), {
		message: "You have to select at least one item.",
	}),
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

	const handleStageChange = (newStage: StagePayload) => {
		setSelectedStage(newStage);
	};

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			stageName: selectedStage.name,
			stageOrder: selectedStage.order,
			items: ["recents", "home"],
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
									Stages <b>{selectedStage.name}</b> can move to:
									{/* {selectedStage.moveConstraints.map((constraint) => {
										return selectedStage.id ===
											constraint.destination.id ? null : (
											<div>
												<Checkbox id={constraint.destination.id} />
												<label
													className="text-sm px-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
													htmlFor={constraint.destination.id}
												>
													{constraint.destination.name}
												</label>
											</div>
										);
									})} */}
									<FormField
										control={form.control}
										name="items"
										render={() => (
											<FormItem>
												<div className="mb-4">
													<FormLabel className="text-base">
														Sidebar
													</FormLabel>
													<FormDescription>
														Select the items you want to display in the
														sidebar.
													</FormDescription>
												</div>
												{items.map((item) => (
													<FormField
														key={item.id}
														control={form.control}
														name="items"
														render={({ field }) => {
															return (
																<FormItem
																	key={item.id}
																	className="flex flex-row items-start space-x-3 space-y-0"
																>
																	<FormControl>
																		<Checkbox
																			checked={field.value?.includes(
																				item.id
																			)}
																			onCheckedChange={(
																				checked
																			) => {
																				return checked
																					? field.onChange(
																							[
																								...field.value,
																								item.id,
																							]
																					  )
																					: field.onChange(
																							field.value?.filter(
																								(
																									value
																								) =>
																									value !==
																									item.id
																							)
																					  );
																			}}
																		/>
																	</FormControl>
																	<FormLabel className="text-sm font-normal">
																		{item.label}
																	</FormLabel>
																</FormItem>
															);
														}}
													/>
												))}
												<FormMessage />
											</FormItem>
										)}
									/>
									<br />
									<FormField
										control={form.control}
										name="items"
										render={() => (
											<FormItem>
												<div className="mb-4">
													<FormLabel className="text-base">
														Move Constraints
													</FormLabel>
													<FormDescription>
														Choose where pubs can move to from this
														stage
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
																			<Checkbox
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
								<CardFooter>
									<Button variant="destructive">Delete</Button>
									<Button type="submit" disabled={!form.formState.isValid}>
										Submit
										{form.formState.isSubmitting && (
											<Icon.Loader2 className="h-4 w-4 ml-4 animate-spin" />
										)}
									</Button>
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
