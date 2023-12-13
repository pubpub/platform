"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui";
import StagesEditor from "./StagesEditor";
import StageCreation from "./StageCreation";
import { StagePayload, StageIndex } from "~/lib/types";
import * as z from "zod";

type Props = {
	community: any;
	stageWorkflows: StagePayload[][];
	stageIndex: StageIndex;
};

export const schema = z.object({
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
						<StagesEditor
							stageWorkflows={props.stageWorkflows}
							stageIndex={props.stageIndex}
						/>
					</div>
				</div>
			</TabsContent>
			<TabsContent value="2">
				<div className="relative inline-flex flex-col max-w-lg">
					<StageCreation
						community={props.community}
						stageWorkflows={props.stageWorkflows}
						stageIndex={props.stageIndex}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
}
