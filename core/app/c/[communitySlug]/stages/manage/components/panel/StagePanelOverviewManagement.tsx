"use client";

import { Button } from "ui/button";

type Props = {
	onDelete(): void;
};

export const StagePanelOverviewManagement = (props: Props) => {
	const onDeleteClick = () => {
		props.onDelete();
	};
	return (
		<>
			<h4 className="mb-2 font-semibold">Stage Management</h4>
			<Button variant="secondary" onClick={onDeleteClick}>
				Delete this Stage
			</Button>
		</>
	);
};
