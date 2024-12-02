"use client";

import React, { forwardRef } from "react";

import { Dialog, DialogOverlay } from "ui/dialog";

import { usePathAwareDialogSearchParam } from "~/lib/client/usePathAwareDialogSearchParam";

export type PathAwareDialogProps = {
	children: React.ReactNode;
	/**
	 * String that is necessary to identify this form from other froms,
	 * otherwise if multiple of the same button are rendered on the page
	 * multiple forms will	 be opened at the same time.
	 *
	 * The null options is used in the case where the searchParam is not there
	 */
	id: string | null;
};

export const PathAwareDialog = forwardRef((props: PathAwareDialogProps, ref) => {
	const {
		isOpen,
		toggleDialog: toggleDialogue,
		currentPathAwareDialogSearchParam,
	} = usePathAwareDialogSearchParam({
		id: props.id,
	});

	const [isReallyOpen, setIsReallyOpen] = React.useState(false);

	React.useEffect(() => {
		setIsReallyOpen(isOpen);
	}, [isOpen]);

	return (
		<Dialog onOpenChange={toggleDialogue} defaultOpen={false} open={isReallyOpen}>
			<DialogOverlay />
			{props.children}
		</Dialog>
	);
});
