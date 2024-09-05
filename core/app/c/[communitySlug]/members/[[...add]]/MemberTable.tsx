"use client";

import * as React from "react";

import type { TableMember } from "./getMemberTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getMemberTableColumns } from "./getMemberTableColumns";

export const MemberTable = ({ members }: { members: TableMember[] }) => {
	const memberTableColumns = getMemberTableColumns();
	return <DataTable columns={memberTableColumns} data={members} searchBy="email" />;
};
