"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Json } from "contracts"
import type { ActionInstances, PubsId, Stages } from "db/public"
import type { Writeable, XOR } from "utils/types"

import Link from "next/link"

import { AutomationEvent } from "db/public"
import { DataTableColumnHeader } from "ui/data-table"
import { DynamicIcon, type IconConfig } from "ui/dynamic-icon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card"

import { ActionRunStatusBadge } from "~/app/components/ActionUI/ActionRunResult"
import { PubTitle } from "~/app/components/PubTitle"
import { getPubTitle, type PubTitleProps } from "~/lib/pubs"

export type ActionRun = {
	id: string
	createdAt: Date
	automation: { id: string; name: string; icon: IconConfig | null } | null
	result: unknown
} & (
	| {
			event: AutomationEvent
			user: null
	  }
	| {
			event: null
			id: string
			firstName: string | null
			lastName: string | null
	  }
) &
	XOR<{ pub: PubTitleProps & { id: PubsId } }, { json: Json }>

export const getActionRunsTableColumns = (communitySlug: string) => {
	const cols = [
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Automation" />,
			accessorKey: "automation",
			cell: ({ getValue }) => {
				const automation = getValue<ActionRun["automation"]>()
				if (!automation) {
					return "Unknown"
				}
				return (
					<div className="flex items-center gap-2">
						<DynamicIcon icon={automation.icon} size={14} />
						<span>{automation.name}</span>
					</div>
				)
			},
		} satisfies ColumnDef<ActionRun, ActionInstances>,
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Initiator" />,
			accessorKey: "event",
			cell: ({ getValue, row }) => {
				const user = row.original.user
				if (user) {
					return `${user.firstName} ${user.lastName}`
				}
				switch (getValue()) {
					case AutomationEvent.automationFailed:
						return `Automation (${row.original.sourceActionInstance?.name} failed)`
					case AutomationEvent.automationSucceeded:
						return `Automation (${row.original.sourceActionInstance?.name} succeeded)`
					case AutomationEvent.pubEnteredStage:
						return "Automation (Pub entered stage)"
					case AutomationEvent.pubLeftStage:
						return "Automation (Pub exited stage)"
					case AutomationEvent.pubInStageForDuration:
						return "Automation (Pub in stage for duration)"
					case AutomationEvent.webhook:
						return "Automation (Webhook)"
				}
			},
		} satisfies ColumnDef<ActionRun, AutomationEvent>,
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage",
			cell: ({ getValue }) => {
				const stage = getValue<ActionRun["stage"]>()
				return stage ? stage.name : "Unknown"
			},
		} satisfies ColumnDef<ActionRun, Stages>,
		{
			id: "input",
			accessorFn: (row) =>
				row.pub ? getPubTitle(row.pub) : (JSON.stringify(row.json, null, 2) ?? "unknown"),
			header: ({ column }) => <DataTableColumnHeader column={column} title="Input" />,
			cell: ({ row }) => {
				return row.original.pub ? (
					<Link
						href={`/c/${communitySlug}/pubs/${row.original.pub.id}`}
						className="underline"
					>
						<PubTitle pub={row.original.pub} />
					</Link>
				) : (
					<pre>
						<code>{JSON.stringify(row.original.json, null, 2)}</code>
					</pre>
				)
			},
		} satisfies ColumnDef<ActionRun, string>,
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
			accessorKey: "createdAt",
		} satisfies ColumnDef<ActionRun, string>,
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
			accessorKey: "status",
			cell: ({ row, getValue }) => {
				const statusValue = getValue()
				const status =
					statusValue === "success" ||
					statusValue === "failure" ||
					statusValue === "scheduled"
						? statusValue
						: "scheduled"
				return (
					<HoverCard>
						<HoverCardTrigger className="cursor-default">
							<ActionRunStatusBadge status={status} />
						</HoverCardTrigger>
						<HoverCardContent className="max-h-96 max-w-md overflow-auto">
							<pre className="text-xs">
								<code>{JSON.stringify(row.original.result, null, 2)}</code>
							</pre>
						</HoverCardContent>
					</HoverCard>
				)
			},
		} satisfies ColumnDef<ActionRun, string>,
	] as const // satisfies ColumnDef<ActionRun, unknown>[];

	return cols as Writeable<typeof cols>
}
