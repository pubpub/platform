"use client";

import { useRef, useState } from "react";

import type { PubsId } from "db/public";
import { Button } from "ui/button";

import { PanelHeader, SidePanel } from "~/app/components/SidePanel";
import { PubsDataTableClient } from "../DataTable/PubsDataTable/PubsDataTableClient";

export const AddRelatedPubsPanel = ({
	title,
	relatedPubIds,
	onCancel,
	onAdd,
}: {
	title: string;
	relatedPubIds: PubsId[];
	onCancel: () => void;
	onAdd: (pubs: PubsId[]) => void;
}) => {
	const sidebarRef = useRef(null);
	const [selected, setSelected] = useState<Record<string, boolean>>(
		Object.fromEntries(relatedPubIds.map((id) => [id, true]))
	);

	const handleAdd = () => {
		const selectedPubIds = Object.entries(selected)
			.filter(([pubId, selected]) => selected)
			.map((selection) => selection[0] as PubsId);
		onAdd(selectedPubIds);
		onCancel();
	};

	return (
		<SidePanel ref={sidebarRef}>
			<div className="flex flex-col gap-2">
				<PanelHeader title={title} showCancel onCancel={onCancel} />
				<PubsDataTableClient rowSelection={selected} onRowSelectionChange={setSelected} />
			</div>
			<div className="mt-auto flex w-full justify-between gap-2">
				<Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					data-testid="add-related-pub-button"
					onClick={handleAdd}
					className="flex-1 bg-blue-500 hover:bg-blue-600"
				>
					Add
				</Button>
			</div>
		</SidePanel>
	);
};
