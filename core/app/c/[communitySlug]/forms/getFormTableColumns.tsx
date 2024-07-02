import type { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import TableActionDropDown from "~/app/components/DataTable/DataTableDropDown";

export type TableForm = {
	id: string;
	formName: string;
	pubType: string;
	updated: Date;
};

export const getFormTableColumns = () =>
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
			header: ({ column }) => (
				<DataTableColumnHeader className="w-52" column={column} title="Name" />
			),
			accessorKey: "formName",
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader className="w-52" column={column} title="Type" />
			),
			accessorKey: "pubType",
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader className="w-52" column={column} title="Updated" />
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
				return <TableActionDropDown />;
			},
		},
	] as const satisfies ColumnDef<TableForm, unknown>[];
