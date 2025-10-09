"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import type { Json } from "contracts";
import type { PubsId } from "db/public";
import type { XOR } from "utils/types";
import { Event } from "db/public";
import { Badge } from "ui/badge";
import { DataTableColumnHeader } from "ui/data-table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";

import type { PubTitleProps } from "~/lib/pubs";
import { PubTitle } from "~/app/components/PubTitle";

export type ActionRun = {
	id: string;
	createdAt: Date;
	actionInstance: { name: string; action: string } | null;
	sourceActionInstance: { name: string; action: string } | null;
	stage: { id: string; name: string } | null;
	result: unknown;
} & (
	| {
			event: Event;
			user: null;
	  }
	| {
			event: null;
			user: {
				id: string;
				firstName: string | null;
				lastName: string | null;
			};
	  }
) &
	XOR<{ pub: PubTitleProps & { id: PubsId } }, { json: Json }>;

export const getActionRunsTableColumns = (communitySlug: string) =>
	[
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
			accessorKey: "actionInstance",
			cell: ({ getValue }) => {
				const actionInstance = getValue<ActionRun["actionInstance"]>();
				return actionInstance ? actionInstance.name : "Unknown";
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Initiator" />,
			accessorKey: "event",
			cell: ({ getValue, row }) => {
				const user = row.original.user;
				if (user) {
					return `${user.firstName} ${user.lastName}`;
				}
				switch (getValue()) {
					case Event.actionFailed:
						return `Rule (${row.original.sourceActionInstance?.name} failed)`;
					case Event.actionSucceeded:
						return `Rule (${row.original.sourceActionInstance?.name} succeeded)`;
					case Event.pubEnteredStage:
						return "Rule (Pub entered stage)";
					case Event.pubLeftStage:
						return "Rule (Pub exited stage)";
					case Event.pubInStageForDuration:
						return "Rule (Pub in stage for duration)";
				}
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage",
			cell: ({ getValue }) => {
				const stage = getValue<ActionRun["stage"]>();
				return stage ? stage.name : "Unknown";
			},
		},
		{
			id: "input",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Input" />,
			accessorFn: (row) =>
				row.pub ? { type: "pub", pub: row.pub } : { type: "json", json: row.json },
			cell: ({ getValue }) => {
				const input = getValue();
				return input?.type === "pub" ? (
					<Link href={`/c/${communitySlug}/pubs/${input.pub.id}`}>
						<PubTitle pub={input.pub} />
					</Link>
				) : (
					<pre>
						<code>{JSON.stringify(input.json, null, 2)}</code>
					</pre>
				);
			},
		} satisfies ColumnDef<
			ActionRun,
			{ type: "pub"; pub: PubTitleProps & { id: PubsId } } | { type: "json"; json: Json }
		>,
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
			accessorKey: "createdAt",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
			accessorKey: "status",
			cell: ({ row, getValue }) => {
				let badge: React.ReactNode;
				switch (getValue()) {
					case "success":
						badge = <Badge>success</Badge>;
						break;
					case "failure":
						badge = <Badge variant="destructive">failure</Badge>;
						break;
					case "scheduled":
						badge = (
							<Badge variant="default" className="bg-orange-500">
								scheduled
							</Badge>
						);
						break;
					default:
						badge = <Badge variant="outline">unknown</Badge>;
						break;
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
				);
			},
		},
	] as const satisfies ColumnDef<ActionRun, unknown>[];
