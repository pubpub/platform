import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui";
import { stageSources } from "~/lib/stages";
import { StageIndex, StagePayload } from "~/lib/types";
import StageForm from "./StageForm";
import * as z from "zod";

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

	// const handleStageEdit = async (data: z.infer<typeof schema>) => {
	// 	console.log(data);
	// };

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
												stage={selectedStage}
												sources={sources}
												onSubmit={() => console.log("edited this")}
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
