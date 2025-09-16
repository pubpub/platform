"use client";

import * as React from "react";

import type { FormsId } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getMemberTableColumns } from "./getMemberTableColumns";

export const MemberTable = ({
	members,
	availableForms,
	updateMember,
}: {
	members: TableMember[];
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
	updateMember: ({
		userId,
		role,
		forms,
	}: {
		userId: TableMember["id"];
		role: TableMember["role"];
		forms: FormsId[];
	}) => Promise<unknown>;
}) => {
	const memberTableColumns = getMemberTableColumns({ availableForms, updateMember });
	return <DataTable columns={memberTableColumns} data={members} searchBy="email" />;
};
