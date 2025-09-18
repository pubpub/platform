"use client";

import * as React from "react";

import type { CommunitiesId, FormsId } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getMemberTableColumns } from "./getMemberTableColumns";

export const MemberTable = ({
	members,
	availableForms,
	communityId,
}: {
	members: TableMember[];
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
	communityId: CommunitiesId;
}) => {
	const memberTableColumns = getMemberTableColumns({ availableForms, communityId });
	return <DataTable columns={memberTableColumns} data={members} searchBy="email" />;
};
