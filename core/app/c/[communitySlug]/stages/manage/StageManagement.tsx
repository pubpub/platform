"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import StageEditor from "./StageEditor";
import { StagePayload, StagesById } from "~/lib/types";

type Props = {
	community: any;
	stageWorkflows: StagePayload[][];
	stagesById: StagesById;
};

export default function StageManagement(props: Props) {
	const [tab, setTab] = useState<number>(1);

	return (
		<Tabs defaultValue={tab.toString()} className="pt-12 md:pt-20">
			<TabsList className="mb-6 ">
				<TabsTrigger
					onClick={(e) => {
						e.preventDefault();
						setTab(1);
					}}
					value="1"
				>
					<div>
						<p className="font-bold text-left">Edit Stages</p>
						<p>Edit your current stages</p>
					</div>
				</TabsTrigger>
				<TabsTrigger
					onClick={(e) => {
						e.preventDefault();
						setTab(2);
					}}
					value="2"
				>
					<div>
						<p className="font-bold text-left">Create new Stages</p>
						<p>create new stages</p>
					</div>
				</TabsTrigger>
			</TabsList>
			<TabsContent value="1">
				<div className="relative flex flex-col text-left lg:text-left">
					<div className="relative inline-flex flex-col">
						<StageEditor
							stageWorkflows={props.stageWorkflows}
							stagesById={props.stagesById}
						/>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}
