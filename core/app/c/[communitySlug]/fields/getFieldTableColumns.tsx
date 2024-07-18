import type { ColumnDef } from "@tanstack/react-table";

import { useCallback } from "react";

import type { CoreSchemaType, PubFieldsId } from "db/public";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";
import { DropdownMenuItem } from "ui/dropdown-menu";
import { Archive, CurlyBraces, History } from "ui/icon";
import { toast } from "ui/use-toast";

import { MenuItemButton, TableActionMenu } from "~/app/components/TableActionMenu";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export interface TableData {
	id: PubFieldsId;
	name: string;
	schema: CoreSchemaType | null;
	updated: Date;
	isArchived: boolean;
}

const ArchiveMenuItem = ({ field }: { field: TableData }) => {
	const archiveField = useServerAction(actions.archiveField);
	const handleArchive = useCallback(async () => {
		const result = await archiveField(field.id);
		if (didSucceed(result)) {
			toast({ title: `Archived ${field.name}` });
		}
	}, [field.id]);
	return (
		<DropdownMenuItem asChild key={field.id}>
			<MenuItemButton onClick={handleArchive} className="gap-2">
				<Archive size={12} /> Archive
			</MenuItemButton>
		</DropdownMenuItem>
	);
};

export const getFieldTableColumns = () =>
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
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Schema"
					icon={<CurlyBraces size={15} strokeWidth={1} />}
				/>
			),
			accessorKey: "schema",
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Updated"
					icon={<History size={15} strokeWidth={1} />}
				/>
			),
			accessorKey: "updated",
			cell: ({ row }) => {
				return <div className="pr-10">{row.original.updated.toLocaleDateString()}</div>;
			},
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				if (row.original.isArchived) {
					return;
				}
				return (
					<TableActionMenu>
						<ArchiveMenuItem field={row.original} />
					</TableActionMenu>
				);
			},
		},
	] as const satisfies ColumnDef<TableData, unknown>[];
