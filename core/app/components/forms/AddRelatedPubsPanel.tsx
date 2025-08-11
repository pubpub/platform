"use client";

import { useRef, useState } from "react";

import type { NonGenericProcessedPub, ProcessedPub } from "contracts";
import type { PubsId, PubTypes } from "db/public";
import { Button } from "ui/button";

import { PanelHeader, SidePanel } from "~/app/components/SidePanel";
import { FormPubsDataTableClient } from "../DataTable/PubsDataTable/FormPubsDataTableClient";

export const AddRelatedPubsPanel = ({
	title,
	relatedPubs,
	onCancel,
	onChangeRelatedPubs,
	disabledPubs,
	pubTypes,
	fieldSlug,
	formSlug,
	currentPubId,
}: {
	title: string;
	formSlug: string;
	fieldSlug: string;
	relatedPubs: ProcessedPub<{ withPubType: true }>[];
	onCancel: () => void;
	onChangeRelatedPubs: (pubs: ProcessedPub<{ withPubType: true }>[]) => void;
	disabledPubs?: PubsId[];
	pubTypes?: Pick<PubTypes, "id" | "name">[];
	currentPubId?: PubsId;
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
				{/* <PubsDataTableClient
					selectedPubs={selected}
					onSelectedPubsChange={setSelected}
					disabledRows={disabledPubs}
					pubTypes={pubTypes}
				/> */}
				<FormPubsDataTableClient
					formSlug={formSlug}
					fieldSlug={fieldSlug}
					selectedPubs={selected}
					onSelectedPubsChange={setSelected}
					disabledRows={disabledPubs}
					pubTypes={pubTypes}
					currentPubId={currentPubId}
				/>
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
