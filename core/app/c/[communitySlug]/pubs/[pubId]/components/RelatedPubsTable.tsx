"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ActionInstances, PubTypes, Stages } from "db/public";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { FullProcessedPub } from "~/lib/server/pub";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { dateFormatOptions } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";

const getRelatedPubsColumns = (relatedPubActionsDropdowns: Record<string, ReactNode>) => {
	return [
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
			header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
			accessorKey: "title",
			cell: ({ row }) => {
				const pathname = usePathname();
				const path = pathname.split("/").slice(0, 4).join("/");
				const title = getPubTitle(row.original);
				return (
					<Link className="block truncate underline" href={`${path}/${row.original.id}`}>
						{title}
					</Link>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Pub Type" />,
			accessorKey: "pubType",
			cell: ({ getValue }) => {
				const pubTypeName = getValue<PubTypes>().name;
				return <Badge variant="outline">{pubTypeName}</Badge>;
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage",
			cell: ({ getValue }) => {
				const stageName = getValue<Stages>()?.name;
				return stageName ? (
					<Badge variant="outline">{stageName}</Badge>
				) : (
					<span className="text-muted-foreground">None</span>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
			accessorKey: "createdAt",
			cell: ({ getValue }) => (
				<time dateTime={new Date().toString()} suppressHydrationWarning>
					{new Date(getValue<string>()).toLocaleString(undefined, dateFormatOptions)}
				</time>
			),
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
			accessorKey: "stage.actions",
			cell: ({ getValue, row }) => {
				return relatedPubActionsDropdowns[row.original.id];
			},
		},
	] as const satisfies ColumnDef<FullProcessedPub, unknown>[];
};

const Table = ({
	pubs,
	relatedPubActionsDropdowns,
}: {
	pubs: FullProcessedPub[];
	relatedPubActionsDropdowns: Record<string, ReactNode>;
}) => {
	const columns = getRelatedPubsColumns(relatedPubActionsDropdowns);

	return <DataTable columns={columns} data={pubs} hidePaginationWhenSinglePage />;
};

export const RelatedPubsTable = ({
	pub,
	relatedPubActionsDropdowns,
}: {
	pub: FullProcessedPub;
	relatedPubActionsDropdowns: Record<string, ReactNode>;
}) => {
	const groupedBySlug = useMemo(() => {
		const grouped: Record<string, { pub: FullProcessedPub; fieldName: string }[]> = {};
		for (const value of pub.values) {
			const { relatedPub, fieldSlug, fieldName } = value;
			if (relatedPub) {
				if (!grouped[fieldSlug]) {
					grouped[fieldSlug] = [];
				}
				grouped[fieldSlug].push({ pub: relatedPub, fieldName });
			}
		}
		return grouped;
	}, [pub]);

	const fields = Object.entries(groupedBySlug).map(([slug, value]) => ({
		slug,
		name: value[0].fieldName,
		count: value.length,
	}));

	const [selected, setSelected] = useState(fields[0]?.slug);

	if (fields.length === 0) {
		return <Table pubs={[]} relatedPubActionsDropdowns={{}} />;
	}

	return (
		<div>
			<div className="flex items-center gap-2">
				{fields.map((field) => {
					const isSelected = selected === field.slug;
					return (
						<Button
							key={field.slug}
							onClick={() => {
								setSelected(field.slug);
							}}
							variant={isSelected ? "default" : "ghost"}
						>
							{field.name}
							<span className="ml-2 font-mono text-xs">{field.count}</span>
						</Button>
					);
				})}
			</div>
			<Table
				pubs={groupedBySlug[selected].map((value) => value.pub)}
				relatedPubActionsDropdowns={relatedPubActionsDropdowns}
			/>
		</div>
	);
};
