"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Json } from "contracts"
import type { ActionInstances, PubsId, Stages } from "db/public"
import type { Writeable, XOR } from "utils/types"
import type { PubTitleProps } from "~/lib/pubs"

import Link from "next/link"

import { Event } from "db/public"
import { Badge } from "ui/badge"
import { DataTableColumnHeader } from "ui/data-table"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card"

import { PubTitle } from "~/app/components/PubTitle"
import { getPubTitle } from "~/lib/pubs"

export type ActionRun = {
	id: string
	createdAt: Date
	actionInstance: { name: string; action: string } | null
	sourceActionInstance: { name: string; action: string } | null
	stage: { id: string; name: string } | null
	result: unknown
} & (
	| {
			event: Event
			user: null
	  }
	| {
			event: null
			user: {
				id: string
				firstName: string | null
				lastName: string | null
			}
	  }
) &
	XOR<{ pub: PubTitleProps & { id: PubsId } }, { json: Json }>

export const getActionRunsTableColumns = (communitySlug: string) => {
	const cols = [
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
			accessorKey: "actionInstance",
			cell: ({ getValue }) => {
				const actionInstance = getValue<ActionRun["actionInstance"]>()
				return actionInstance ? actionInstance.name : "Unknown"
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
					case Event.actionFailed:
						return `Automation (${row.original.sourceActionInstance?.name} failed)`
					case Event.actionSucceeded:
						return `Automation (${row.original.sourceActionInstance?.name} succeeded)`
					case Event.pubEnteredStage:
						return "Automation (Pub entered stage)"
					case Event.pubLeftStage:
						return "Automation (Pub exited stage)"
					case Event.pubInStageForDuration:
						return "Automation (Pub in stage for duration)"
					case Event.webhook:
						return "Automation (Webhook)"
				}
			},
		} satisfies ColumnDef<ActionRun, Event>,
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
				let badge: React.ReactNode
				switch (getValue()) {
					case "success":
						badge = <Badge>success</Badge>
						break
					case "failure":
						badge = <Badge variant="destructive">failure</Badge>
						break
					case "scheduled":
						badge = (
							<Badge variant="default" className="bg-orange-500">
								scheduled
							</Badge>
						)
						break
					default:
						badge = <Badge variant="outline">unknown</Badge>
						break
				}
				return (
					<HoverCard>
						<HoverCardTrigger className="cursor-default">{badge}</HoverCardTrigger>
						<HoverCardContent className="overflow-scroll">
							<pre>
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
