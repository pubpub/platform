"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "ui/badge";
import { DataTableColumnHeader } from "ui/data-table";

import { PubTitle } from "~/app/components/PubTitle";

export type ActionRun = {
	id: string;
	createdAt: Date;
	actionInstance: { name: string; action: string };
	stage: { id: string; name: string };
	pub: {
		id: string;
		values: { field: { slug: string }; value: unknown }[] | Record<string, unknown>;
		createdAt: Date;
	};
};

export const getActionRunsTableColumns = () =>
	[
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
			accessorKey: "actionInstance.name",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
			accessorKey: "event",
			cell: ({ getValue }) => {
				switch (getValue()) {
					case "pubEnteredStage":
						return "Entered stage";
					case "pubLeftStage":
						return "Left stage";
					default:
						// TODO: Display user who triggered the action
						return "Manual";
				}
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage.name",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Pub" />,
			accessorKey: "pub",
			cell: ({ getValue }) => <PubTitle pub={getValue<ActionRun["pub"]>()} />,
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
						return <Badge color="green">success</Badge>;
					case "failure":
						return <Badge color="red">failure</Badge>;
					default:
						return <Badge variant="outline">unknown</Badge>;
				}
			},
		},
	] as const satisfies ColumnDef<ActionRun, unknown>[];
