import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, toast } from "ui";
import { StageFormSchema, stageSources } from "~/lib/stages";
import { DeepPartial, StageIndex, StagePayload } from "~/lib/types";
import StageForm from "./StageForm";
import { editStage } from "./actions";

type Props = {
	stageWorkflows: StagePayload[][];
	stageIndex: StageIndex;
};

const StageEditor = (props: Props) => {
	const [selectedStage, setSelectedStage] = useState(props.stageWorkflows[0][0]); // Set the initial selected stage.
	const sources = stageSources(selectedStage, props.stageIndex);

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
				description: `${patchData.name} was updated successfully!`,
			});
		}
	};
	console.log(props.stageWorkflows);
	return (
		<div className="space-x-4">
			{props.stageWorkflows.map((stages) => {
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
											stageIndex={props.stageIndex}
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
