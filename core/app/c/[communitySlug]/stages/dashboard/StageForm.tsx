import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Form, useForm } from "react-hook-form";
import {
	Button,
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
import { schema } from "./StageManagement";

type Props = {
	stage: any;
	sources: any;
	onSubmit: (stagFormData: any) => void;
};

export default function StageForm(props: Props) {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			stageName: props.stage.name,
			stageOrder: props.stage.order,
			stageMoveConstraints: props.stage.moveConstraints,
		},
	});
	useEffect(() => {
		form.reset({
			stageName: props.stage.name,
			stageOrder: props.stage.order,
			stageMoveConstraints: props.stage.moveConstraints,
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
					<FormField
						control={form.control}
						name="stageMoveConstraints"
						render={() => (
							<FormItem>
								<div className="mb-4">
									<FormLabel className="text-base font-bold">Moves to</FormLabel>
									<FormDescription>
										These are stages {props.stage.name} can move to
									</FormDescription>

									{props.stage.moveConstraints.map((stage) => {
										return props.stage.id === stage.id ? null : (
											<FormField
												key={stage.id}
												control={form.control}
												name="stageMoveConstraints"
												render={({ field }) => {
													console.log(
														props.stage.moveConstraints.some(
															(constraint) =>
																field.value.includes(constraint)
														)
													);
													console.log(
														field.value?.some((constarint) =>
															props.stage.moveConstraints.includes(
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
																<input
																	type="checkbox"
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
								</div>
							</FormItem>
						)}
					/>
					<div className="mb-4">
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
					</div>
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
