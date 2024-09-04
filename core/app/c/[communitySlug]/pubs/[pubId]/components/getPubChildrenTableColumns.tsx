"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Stages } from "db/public";
import { Badge } from "ui/badge";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import { UserCard } from "~/app/components/UserCard";
import { PubPayload } from "~/lib/types";
import { ChildPubRow, ChildPubRowPubType } from "./types";

const createdAtDateOptions = {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

const createMemberColumns = (pubType: ChildPubRowPubType) =>
	pubType.fields
		.filter((field) => field.schemaName === "MemberId")
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
					cell: ({ row, getValue }) => {
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
				const pathname = usePathname();
				const path = pathname.split("/").slice(0, 4).join("/");
				const title =
					(Object.entries(row.original.values).find(
						([slug]) => slug.split(":")[1]?.indexOf("title") !== -1
					)?.[1] as string) ||
					childPubType?.name ||
					"Child";
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
			cell: ({ getValue }) =>
				new Date(getValue<string>()).toLocaleString([], createdAtDateOptions),
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
			enableHiding: false,
			accessorKey: "actionInstances",
			cell: ({ row }) => childPubRunActionDropdowns[row.index],
		},
	] as const satisfies ColumnDef<ChildPubRow, unknown>[];
