"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input } from "ui";
import prisma from "~/prisma/db";
import StagesEditor from "./StagesEditor";

type Props = {
	community: any;
	stages: any;
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

	const handleStageCreate = async () => {
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
				<div className="flex flex-row space-x-6 mb-8 md:mb-0 ">
					<button
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
							<div className="font-bold tracking-tight mb-1 text-left">
								Edit Stages
							</div>
							<div className="text-gray-600">Edit your current stages</div>
						</div>
					</button>
					<button
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
							<div className="font-bold tracking-tight mb-1 text-left">
								Create new Stages
							</div>
							<div className="text-gray-600">create new stages</div>
						</div>
					</button>
				</div>
				<div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-2 lg:col-span-2 mb-8 md:mb-0 md:order-1">
					<div className="relative flex flex-col text-center lg:text-left" ref={tabs}>
						{tab === 1 ? (
							<div className="relative inline-flex flex-col">
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
