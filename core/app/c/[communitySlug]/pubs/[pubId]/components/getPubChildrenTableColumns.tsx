"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import type { Stages } from "db/public";
import { CoreSchemaType } from "db/public";
import { Badge } from "ui/badge";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import type { ChildPubRow, ChildPubRowPubType } from "./types";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { UserCard } from "~/app/components/UserCard";
import { getPubTitle } from "~/lib/pubs";

export const createdAtDateOptions = {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

const createMemberColumns = (pubType: ChildPubRowPubType) =>
	pubType.fields
		.filter((field) => field.schemaName === CoreSchemaType.MemberId)
		.map(
			(field) =>
				({
					id: field.id,
					header: ({ column }) => (
						<DataTableColumnHeader column={column} title={field.name} />
					),
					accessorKey: "memberFields",
					accessorFn: (row) => {
						const memberField = row.memberFields.find(
							(memberField) => memberField.fieldId === field.id
						);
						return memberField
							? memberField.user.firstName + " " + memberField.user.lastName
							: "None";
					},
					cell: ({ row }) => {
						const memberField = row.original.memberFields.find(
							(memberField) => memberField.fieldId === field.id
						);
						return memberField ? (
							<UserCard user={memberField.user} />
						) : (
							<span className="text-muted-foreground">None</span>
						);
					},
				}) as ColumnDef<ChildPubRow, unknown>
		);

export const getPubChildrenTableColumns = (
	childPubRunActionDropdowns: JSX.Element[],
	childPubType?: ChildPubRowPubType
) =>
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
			header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
			accessorKey: "title",
			cell: ({ row }) => {
				const pathname = useCommunity();
				const path = `/c/${pathname.slug}/pubs/${row.original.id}` as const;

				const title = getPubTitle({
					...row.original,
					pubType: childPubType ?? { name: "Child" },
				});
				return (
					<Link className="block truncate underline" href={`${path}/${row.original.id}`}>
						{title}
					</Link>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stages",
			cell: ({ getValue }) => {
				const stageName = getValue<Stages[]>()[0]?.name;
				return stageName ? (
					<Badge variant="outline">{stageName}</Badge>
				) : (
					<span className="text-muted-foreground">None</span>
				);
			},
		},
		...(childPubType ? createMemberColumns(childPubType) : []),
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
			accessorKey: "createdAt",
			cell: ({ getValue }) => (
				<time dateTime={new Date().toString()} suppressHydrationWarning>
					{new Date(getValue<string>()).toLocaleString(undefined, createdAtDateOptions)}
				</time>
			),
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
			enableHiding: false,
			accessorKey: "actionInstances",
			cell: ({ row }) => childPubRunActionDropdowns[row.index],
		},
	] as const satisfies ColumnDef<ChildPubRow, unknown>[];
