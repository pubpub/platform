"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Event } from "@prisma/client";

import { Badge } from "ui/badge";
import { DataTableColumnHeader } from "ui/data-table";

import { PubTitle } from "~/app/components/PubTitle";

export type ActionRun = {
	id: string;
	createdAt: Date;
	actionInstance: { name: string; action: string } | null;
	stage: { id: string; name: string } | null;
	pub: {
		id: string;
		values: { field: { slug: string }; value: unknown }[] | Record<string, unknown>;
		createdAt: Date;
	} | null;
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

export const getActionRunsTableColumns = () =>
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
				return pub ? <PubTitle pub={pub} /> : "Unknown";
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
			accessorKey: "createdAt",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
			accessorKey: "status",
			cell: ({ getValue }) => {
				switch (getValue()) {
					case "success":
						return <Badge>success</Badge>;
					case "failure":
						return <Badge variant="destructive">failure</Badge>;
					default:
						return <Badge variant="outline">unknown</Badge>;
				}
			},
		},
	] as const satisfies ColumnDef<ActionRun, unknown>[];
