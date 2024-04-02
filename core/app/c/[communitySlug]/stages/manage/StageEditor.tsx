import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { toast } from "ui/use-toast";

import { moveConstraintSourcesForStage, StageFormSchema } from "~/lib/stages";
import { DeepPartial, StagePayload, StagesById } from "~/lib/types";
import { editStage } from "./actions";
import StageForm from "./StageForm";

type Props = {
	stageWorkflows: StagePayload[][];
	stagesById: StagesById;
};

const StageEditor = (props: Props) => {
	const [selectedStage, setSelectedStage] = useState(props.stageWorkflows[0][0]); // Set the initial selected stage.
	const sources = moveConstraintSourcesForStage(selectedStage, props.stagesById);

	const handleStageChange = (newStage: StagePayload) => {
		setSelectedStage(newStage);
	};

	const onSubmit = async (patchData: DeepPartial<StageFormSchema>) => {
		const res = await editStage(selectedStage.id, patchData);
		if ("error" in res && typeof res.error === "string") {
			toast({
				title: "Error",
				description: res.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: `${patchData.name || selectedStage.name} was updated successfully!`,
			});
		}
	};
	return (
		<div className="space-x-4">
			{props.stageWorkflows.map((stages, index) => {
				return (
					<div className="space-y-2">
						<Tabs defaultValue={selectedStage.id}>
							<div className="mb-4">
								<h2 className="text-2xl font-bold text-orange-200">
									Workflow {index}
								</h2>
							</div>
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
											stagesById={props.stagesById}
										/>
									</TabsContent>
								);
							})}
						</Tabs>
					</div>
				);
			})}
		</div>
	);
};

export default StageEditor;
