"use client";

import { useState } from "react";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { Plus } from "ui/icon";

import NewFieldForm from "./NewFieldForm";

const Footer = ({ onCancel }: { onCancel: () => void }) => {
	return (
		<DialogFooter className="gap-y-1">
			<Button onClick={onCancel} type="button" variant="outline">
				Cancel
			</Button>
			<Button type="submit" className="bg-blue-500 hover:bg-blue-600">
				Create
			</Button>
		</DialogFooter>
	);
};

const NewFieldButton = () => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen} modal={true}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button className="flex items-center gap-x-2 rounded-md bg-emerald-500 text-white shadow hover:bg-emerald-600">
					<Plus size="16" /> <span>New Field</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[20rem] max-w-fit overflow-auto md:min-w-[32rem]">
				<DialogHeader>
					<DialogTitle>Create New Field</DialogTitle>
				</DialogHeader>
				<NewFieldForm
					onSubmitSuccess={() => {
						setIsOpen(false);
					}}
				/>
				<Footer
					onCancel={() => {
						setIsOpen(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default NewFieldButton;
