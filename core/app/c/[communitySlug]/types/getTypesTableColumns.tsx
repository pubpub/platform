import type { ColumnDef } from "@tanstack/react-table"
import type { GetPubTypesResult } from "~/lib/server/pubtype"

import { Hash } from "lucide-react"

import { Checkbox } from "ui/checkbox"
import { DataTableColumnHeader } from "ui/data-table"
import { History } from "ui/icon"

import { formatDateAsPossiblyDistance } from "~/lib/dates"

export const getTypesTableColumns = () =>
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
				const { name, description } = row.original
				return (
					<div className="flex flex-col gap-1">
						<span className="font-medium">{name}</span>
						{description && (
							<span className="text-sm text-muted-foreground">{description}</span>
						)}
					</div>
				)
			},
		},
		{
			id: "fields",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Fields"
					icon={<Hash size={15} strokeWidth={1} />}
				/>
			),
			accessorFn: (row) => row.fields.length,
			cell: ({ row }) => {
				return <div className="pr-10">{row.original.fields.length}</div>
			},
		},
		{
			id: "updated",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Updated"
					icon={<History size={15} strokeWidth={1} />}
				/>
			),
			accessorKey: "updated",
			cell: ({ row }) => {
				return (
					<div className="pr-10">
						{formatDateAsPossiblyDistance(new Date(row.original.updatedAt))}
					</div>
				)
			},
		},
	] as const satisfies ColumnDef<GetPubTypesResult[number], unknown>[]
