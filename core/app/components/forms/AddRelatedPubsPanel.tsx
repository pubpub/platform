"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { useRef, useState } from "react";

import type { PubsId } from "db/public";
import { pubFieldsIdSchema, pubsIdSchema } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import type { GetPubsResult } from "~/lib/server";
import { PanelHeader, SidePanel } from "~/app/components/SidePanel";
import { DataTable } from "../DataTable/v2/DataTable";

const getColumns = () =>
	[
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="mr-2 h-4 w-4"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
			accessorKey: "name",
			cell: ({ row }) => {
				return (
					<div className="flex items-center gap-2">
						<span>{row.original.title}</span>
					</div>
				);
			},
		},
	] as const satisfies ColumnDef<GetPubsResult[number], unknown>[];

export const AddRelatedPubsPanel = ({
	title,
	onCancel,
	onAdd,
	pubs,
}: {
	title: string;
	onCancel: () => void;
	onAdd: (pubs: GetPubsResult) => void;
	pubs: GetPubsResult;
}) => {
	const sidebarRef = useRef(null);
	const [selected, setSelected] = useState<Record<string, boolean>>({});

	const handleAdd = () => {
		const selectedPubIds = Object.entries(selected)
			.filter(([pubId, selected]) => selected)
			.map((selection) => selection[0] as PubsId);
		const selectedPubs = pubs.filter((p) => selectedPubIds.includes(p.id));
		onAdd(selectedPubs);
	};

	return (
		<SidePanel ref={sidebarRef} className="justify-between">
			<div className="flex flex-col gap-2">
				<PanelHeader title={title} showCancel onCancel={onCancel} />
				<DataTable
					columns={getColumns()}
					data={pubs}
					selectedRows={selected}
					setSelectedRows={setSelected}
					getRowId={(d) => d.id}
				/>
			</div>
			<div className="flex w-full justify-between gap-2">
				<Button variant="outline" className="flex-1" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleAdd} className="flex-1 bg-blue-500 hover:bg-blue-600">
					Add
				</Button>
			</div>
		</SidePanel>
	);
};
