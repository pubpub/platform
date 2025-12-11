import type { ColumnDef } from "@tanstack/react-table"
import type { FormsId } from "db/public"

import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { DataTableColumnHeader } from "ui/data-table"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { Ellipsis, History, ToyBrick } from "ui/icon"

import { ArchiveFormButton } from "~/app/components/FormBuilder/ArchiveFormButton"
import { RestoreFormButton } from "~/app/components/FormBuilder/RestoreFormButton"

export type TableForm = {
	id: FormsId
	slug: string
	formName: string
	pubType: string
	updated: Date
	isArchived: boolean
	isDefault: boolean
}

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
				<DataTableColumnHeader className="w-52" column={column} title="Default" />
			),
			accessorKey: "isDefault",
			cell: ({ row }) => (row.original.isDefault ? "Yes" : "No"),
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader
					className="w-52"
					column={column}
					title="Type"
					icon={<ToyBrick size={15} strokeWidth={1} />}
				/>
			),
			accessorKey: "pubType",
		},
		{
			header: ({ column }) => (
				<DataTableColumnHeader
					className="w-52"
					column={column}
					title="Updated"
					icon={<History size={15} strokeWidth={1} />}
				/>
			),
			accessorKey: "updated",
			cell: ({ row }) => {
				return <div className="pr-10">{row.original.updated.toLocaleDateString()}</div>
			},
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="h-8 w-8 p-0"
								data-testid={`${row.original.slug}-actions-button`}
							>
								<span className="sr-only">Open menu</span>
								<Ellipsis className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="p-0">
							<DropdownMenuItem asChild key={row.original.id}>
								{row.original.isArchived ? (
									<RestoreFormButton
										className="w-full justify-start pl-3"
										id={row.original.id}
										slug={row.original.slug}
									/>
								) : (
									<ArchiveFormButton
										className="w-full justify-start pl-3"
										id={row.original.id}
										slug={row.original.slug}
									/>
								)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			},
		},
	] as const satisfies ColumnDef<TableForm, unknown>[]
