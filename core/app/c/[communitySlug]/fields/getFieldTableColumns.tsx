import type { ColumnDef } from "@tanstack/react-table"
import type { CoreSchemaType, PubFieldsId } from "db/public"

import { useCallback } from "react"
import { SCHEMA_TYPES_WITH_ICONS } from "schemas"

import { Checkbox } from "ui/checkbox"
import { DataTableColumnHeader } from "ui/data-table"
import { DropdownMenuItem } from "ui/dropdown-menu"
import { Archive, History } from "ui/icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { toast } from "ui/use-toast"

import { MenuItemButton, TableActionMenu } from "~/app/components/TableActionMenu"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import * as actions from "./actions"

export interface TableData {
	id: PubFieldsId
	name: string
	schemaName: CoreSchemaType | null
	updated: Date
	isArchived: boolean
	slug: string
	isRelation: boolean
}

const ArchiveMenuItem = ({ field }: { field: TableData }) => {
	const archiveField = useServerAction(actions.archiveField)
	const handleArchive = useCallback(async () => {
		const result = await archiveField(field.id)
		if (didSucceed(result)) {
			toast({ title: `Archived ${field.name}` })
		}
	}, [field.id])
	return (
		<DropdownMenuItem asChild key={field.id}>
			<MenuItemButton onClick={handleArchive} className="gap-2">
				<Archive size={12} /> Archive
			</MenuItemButton>
		</DropdownMenuItem>
	)
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
			header: () => <span> </span>,
			accessorKey: "schemaName",
			id: "schemaNameIcon",
			cell: ({ cell }) => {
				const schemaName = cell.getValue<CoreSchemaType>()
				const Icon = schemaName ? SCHEMA_TYPES_WITH_ICONS[schemaName].icon : null
				if (!Icon) return null
				return (
					<Tooltip>
						<TooltipTrigger>
							<Icon className="w-4" />
							<span className="sr-only">{schemaName}</span>
						</TooltipTrigger>
						<TooltipContent>{schemaName}</TooltipContent>
					</Tooltip>
				)
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
			accessorKey: "name",
			cell: ({ row }) => {
				return (
					<div className="flex items-center gap-2">
						<span>{row.original.name}</span>
					</div>
				)
			},
		},
		{
			id: "slug",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
			accessorKey: "slug",
			cell: ({ row }) => (
				<div className="pr-10">
					<span className="rounded-xs border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-blue-400 text-xs dark:border-blue-400 dark:bg-blue-800/80 dark:text-blue-100">
						{row.original.slug}
					</span>
				</div>
			),
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
				return <div className="pr-10">{row.original.updated.toLocaleDateString()}</div>
			},
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				if (row.original.isArchived) {
					return
				}
				return (
					<TableActionMenu>
						<ArchiveMenuItem field={row.original} />
					</TableActionMenu>
				)
			},
		},
	] as const satisfies ColumnDef<TableData, unknown>[]
