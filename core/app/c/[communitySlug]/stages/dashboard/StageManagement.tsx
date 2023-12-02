"use client";

import { useState } from "react";
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "ui";
import StagesEditor from "./StagesEditor";

type Props = {
	community: any;
	stages: any;
};

export default function StageManagement(props: Props) {
	const [tab, setTab] = useState<number>(1);
	return (
		<Tabs defaultValue={tab.toString()} className="pt-12 md:pt-20">
			<TabsList className="mb-6">
				<TabsTrigger
					onClick={(e) => {
						e.preventDefault();
						setTab(1);
					}}
					value="1"
				>
					<div>
						<p className="font-bold tracking-tight mb-1 text-left">Edit Stages</p>
						<p className="text-gray-600">Edit your current stages</p>
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
						<p className="font-bold tracking-tight mb-1 text-left">Create new Stages</p>
						<p className="text-gray-600">create new stages</p>
					</div>
				</TabsTrigger>
			</TabsList>
			<TabsContent
				value="1"
				className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-2 lg:col-span-2 mb-8 md:mb-0 md:order-1"
			>
				<div className="relative flex flex-col text-center lg:text-left">
					<div className="relative inline-flex flex-col">
						<StagesEditor stages={props.stages} />
					</div>
				</div>
			</TabsContent>
			<TabsContent
				value="2"
				className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-2 lg:col-span-2 mb-8 md:mb-0 md:order-1"
			>
				<div className="relative inline-flex flex-col max-w-lg">
					<Input placeholder="Stage Name" />
					<Button> Create stage </Button>
				</div>
			</TabsContent>
		</Tabs>
	);
}
