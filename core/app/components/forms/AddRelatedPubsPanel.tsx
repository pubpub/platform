"use client";

import { useRef, useState } from "react";

import type { NonGenericProcessedPub, ProcessedPub } from "contracts";
import { Button } from "ui/button";

import { PanelHeader, SidePanel } from "~/app/components/SidePanel";
import { PubsDataTableClient } from "../DataTable/PubsDataTable/PubsDataTableClient";

export const AddRelatedPubsPanel = ({
	title,
	relatedPubs,
	onCancel,
	onChangeRelatedPubs,
}: {
	title: string;
	relatedPubs: ProcessedPub<{ withPubType: true }>[];
	onCancel: () => void;
	onChangeRelatedPubs: (pubs: ProcessedPub<{ withPubType: true }>[]) => void;
}) => {
	const sidebarRef = useRef(null);
	const [selected, setSelected] = useState<NonGenericProcessedPub[]>(relatedPubs);

	const handleUpdate = () => {
		onChangeRelatedPubs(selected as ProcessedPub<{ withPubType: true }>[]);
		onCancel();
	};

	return (
		<SidePanel ref={sidebarRef}>
			<div className="flex flex-col gap-2">
				<PanelHeader title={title} showCancel onCancel={onCancel} />
				<PubsDataTableClient selectedPubs={selected} onSelectedPubsChange={setSelected} />
			</div>
			<div className="mt-auto flex w-full justify-between gap-2">
				<Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					data-testid="add-related-pub-button"
					onClick={handleUpdate}
					className="flex-1 bg-blue-500 hover:bg-blue-600"
				>
					Update
				</Button>
			</div>
		</SidePanel>
	);
};
