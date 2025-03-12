"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import type { PubsId } from "db/public";
import { Badge } from "ui/badge";
import { DataTableColumnHeader } from "ui/data-table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";

import type { PubTitleProps } from "~/lib/pubs";
import { PubTitle } from "~/app/components/PubTitle";

export type ActionRun = {
	id: string;
	createdAt: Date;
	actionInstance: { name: string; action: string } | null;
	stage: { id: string; name: string } | null;
	pub: PubTitleProps & { id: PubsId };
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
);

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
					case "pubEnteredStage":
						return "Rule (Pub entered stage)";
					case "pubLeftStage":
						return "Rule (Pub exited stage)";
					case "pubInStageForDuration":
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
			header: ({ column }) => <DataTableColumnHeader column={column} title="Pub" />,
			accessorKey: "pub",
			cell: ({ getValue }) => {
				const pub = getValue<ActionRun["pub"]>();
				return pub ? (
					<Link href={`/c/${communitySlug}/pubs/${pub.id}`}>
						<PubTitle pub={pub} />
					</Link>
				) : (
					"Unknown"
				);
			},
		},
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
