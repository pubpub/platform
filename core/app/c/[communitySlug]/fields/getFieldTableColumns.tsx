import type { ColumnDef } from "@tanstack/react-table";
import type { CoreSchemaType } from "schemas";

import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";
import { DropdownMenuItem } from "ui/dropdown-menu";
import { Archive, CurlyBraces, History } from "ui/icon";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import { MenuItemButton, TableActionMenu } from "~/app/components/TableActionMenu";

export interface TableData {
	id: PubFieldsId;
	name: string;
	schema: CoreSchemaType | null;
	updated: Date;
}

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
				return (
					<TableActionMenu>
						<DropdownMenuItem asChild key={row.original.id}>
							<MenuItemButton className="flex w-full justify-start gap-2">
								<Archive size={12} /> Archive
							</MenuItemButton>
						</DropdownMenuItem>
					</TableActionMenu>
				);
			},
		},
	] as const satisfies ColumnDef<TableData, unknown>[];
