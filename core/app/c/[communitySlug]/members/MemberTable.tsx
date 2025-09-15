"use client";

import * as React from "react";

import type { FormsId } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getMemberTableColumns } from "./getMemberTableColumns";

export const MemberTable = ({
	members,
	availableForms,
}: {
	members: TableMember[];
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
}) => {
	const memberTableColumns = getMemberTableColumns(availableForms);
	return <DataTable columns={memberTableColumns} data={members} searchBy="email" />;
};
