"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input, Card, CardContent, CardFooter, CardTitle } from "ui";
import prisma from "~/prisma/db";

type Props = {
	community: any;
	stages: any;
};

const StagesEditor = ({ stages }) => {
	const [selectedStage, setSelectedStage] = useState(stages[0]); // Set the initial selected stage.

	const handleStageChange = (newStage: string) => {
		setSelectedStage(newStage);
	};

	return (
		<div className="flex flex-col space-x-4">
			<div>
				{/* Display a list of stages as tabs */}
				<div className="space-y-2">
					{stages.map((stage) => (
						<button
							key={stage}
							className={`px-4 py-2 border ${
								selectedStage === stage ? "text-white bg-black" : ""
							}`}
							onClick={() => handleStageChange(stage)}
						>
							{stage.name}
						</button>
					))}
				</div>
			</div>

			<div>
				{/* Display the selected stage for editing */}
				<div className="p-4">
					{/* Add your editing content here */}
					<h1>Edit Stage: {selectedStage.name}</h1>
				</div>
			</div>
		</div>
	);
};

export default function StageManagement(props: Props) {
	const [tab, setTab] = useState<number>(1);

	const tabs = useRef<HTMLDivElement>(null);

	const heightFix = () => {
		if (tabs.current && tabs.current.parentElement)
			tabs.current.parentElement.style.height = `${tabs.current.clientHeight}px`;
	};

	useEffect(() => {
		heightFix();
	}, []);

	const handleSubmit = async () => {
		console.log("clicked");
		await prisma.stage.create({
			data: {
				name: "test",
				communityId: props.community.id,
				order: "zz",
			},
		});
	};

	return (
		<div>
			<div className="pt-12 md:pt-20">
				<div className="flex flex-row space-x-6 mb-8 md:mb-0">
					<div
						className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
							tab !== 1
								? "bg-white shadow-md border-gray-200 hover:shadow-lg"
								: "bg-gray-200 border-transparent"
						}`}
						onClick={(e) => {
							e.preventDefault();
							setTab(1);
						}}
					>
						<div>
							<div className="font-bold leading-snug tracking-tight mb-1">
								Edit Stages
							</div>
							<div className="text-gray-600">Edit your current stages</div>
						</div>
					</div>
					<div
						className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
							tab !== 2
								? "bg-white shadow-md border-gray-200 hover:shadow-lg"
								: "bg-gray-200 border-transparent"
						}`}
						onClick={(e) => {
							e.preventDefault();
							setTab(2);
						}}
					>
						<div>
							<div className="font-bold leading-snug tracking-tight mb-1">
								Create new Stages
							</div>
							<div className="text-gray-600">create new stages</div>
						</div>
					</div>
				</div>
				<div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-2 lg:col-span-2 mb-8 md:mb-0 md:order-1">
					<div className="relative flex flex-col text-center lg:text-left" ref={tabs}>
						{tab === 1 ? (
							<div className="relative inline-flex flex-col">
								{/* {props.stages && renderStages()} */}
								<StagesEditor stages={props.stages} />
							</div>
						) : (
							<div className="relative inline-flex flex-col">
								<Input placeholder="Stage Name" />
								<Button> Create stage </Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
