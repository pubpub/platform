import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, toast } from "ui";
import * as z from "zod";
import { stageFormSchema, stageSources } from "~/lib/stages";
import { StageIndex, StagePayload } from "~/lib/types";
import StageForm from "./StageForm";
import { editStage } from "./actions";

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

	const onSubmit = async (data: z.infer<typeof stageFormSchema>) => {
		console.log(data);
		const updatedStage = await editStage(data);
		console.log(updatedStage);
		// if (res.status !== 200) {
		// 	toast({
		// 		title: "Error",
		// 		description: res.statusText,
		// 		variant: "destructive",
		// 	});
		// } else {
		// 	toast({
		// 		title: "Success",
		// 		description: `${data.stageName} was updated successfully!`,
		// 	});
		// }
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
											<StageForm
												stage={stage}
												sources={sources}
												onSubmit={onSubmit}
												stages={stages}
											/>
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
