"use client";

import type { ReactNode } from "react";

import { useCallback, useState } from "react";

import type { PubTypesId } from "db/public";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";

import { Footer } from "~/app/components/CreateEditDialog";
import { NewTypeForm } from "./NewTypeForm";

export const UpdatePubTypeButton = ({
	children,
	pubTypeId,
	name,
	description,
}: {
	children: ReactNode;
	pubTypeId: PubTypesId;
	name: string;
	description?: string | null;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const onSuccess = useCallback((pubTypeId: PubTypesId) => {
		setIsOpen(false);
	}, []);

	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				<DialogTitle>Edit Type</DialogTitle>

				{isOpen && (
					<NewTypeForm
						mode="edit"
						onSubmitSuccess={onSuccess}
						pubTypeId={pubTypeId}
						name={name}
						description={description}
					>
						<Footer submitText="Update" onCancel={() => setIsOpen(false)} />
					</NewTypeForm>
				)}
			</DialogContent>
		</Dialog>
	);
};
