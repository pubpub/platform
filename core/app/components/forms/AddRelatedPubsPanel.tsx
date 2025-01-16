"use client";

import { useRef } from "react";

import { PanelHeader, SidePanel } from "~/app/components/SidePanel";

export const AddRelatedPubsPanel = ({
	title,
	onCancel,
}: {
	title: string;
	onCancel: () => void;
}) => {
	const sidebarRef = useRef(null);

	return (
		<SidePanel ref={sidebarRef}>
			<PanelHeader title={title} showCancel onCancel={onCancel} />
		</SidePanel>
	);
};
