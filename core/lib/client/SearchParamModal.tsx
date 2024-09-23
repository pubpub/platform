"use client";

import React from "react";

import { Dialog, DialogOverlay } from "ui/dialog";

import { useSearchParamModal } from "./useSearchParamModal";

export const SearchParamModal = ({
	children,
	identifyingString,
}: {
	children: React.ReactNode;
	/**
	 * String that is necessary to identify this form from other froms,
	 * otherwise if multiple of the same button are rendered on the page
	 * multiple forms will be opened at the same time.
	 */
	identifyingString: string;
}) => {
	const { isOpen, toggleModal } = useSearchParamModal({
		identifyingString,
	});

	const [isReallyOpen, setIsReallyOpen] = React.useState(false);

	React.useEffect(() => {
		setIsReallyOpen(isOpen);
	}, [isOpen]);

	return (
		<Dialog onOpenChange={toggleModal} defaultOpen={false} open={isReallyOpen}>
			<DialogOverlay />
			{children}
		</Dialog>
	);
};
