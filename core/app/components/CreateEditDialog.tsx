"use client";

import { useFormContext } from "react-hook-form";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from "ui/dialog";
import { FormSubmitButton } from "ui/submit-button";

export const Footer = ({ onCancel, submitText }: { onCancel: () => void; submitText: string }) => {
	const form = useFormContext();
	return (
		<DialogFooter className="gap-y-1">
			<Button onClick={onCancel} type="button" variant="outline">
				Cancel
			</Button>
			{form ? (
				<FormSubmitButton
					formState={form.formState}
					className="bg-blue-500 hover:bg-blue-600"
					idleText={submitText}
				/>
			) : (
				<Button type="submit" className="bg-blue-500 hover:bg-blue-600">
					{submitText}
				</Button>
			)}
		</DialogFooter>
	);
};

export const CreateEditDialog = ({
	title,
	onOpenChange,
	open,
	children,
	trigger,
}: {
	title: string;
	children: React.ReactNode;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	trigger?: React.ReactNode;
}) => {
	return (
		<Dialog onOpenChange={onOpenChange} defaultOpen={false} open={open} modal={true}>
			<DialogOverlay />
			{trigger}
			<DialogContent className="max-h-full min-w-[20rem] max-w-fit overflow-auto md:min-w-[32rem]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
};
