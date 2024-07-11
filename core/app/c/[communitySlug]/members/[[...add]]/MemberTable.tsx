"use client";

import * as React from "react";
import { Community } from "@prisma/client";

import { DataTable } from "~/app/components/DataTable/DataTable";
import { getMemberTableColumns, TableMember } from "./getMemberTableColumns";

export const MemberTable = ({
	members,
	community,
}: {
	members: TableMember[];
	community: Community;
}) => {
	const memberTableColumns = getMemberTableColumns({ community });
	return <DataTable columns={memberTableColumns} data={members} searchBy="email" />;
};
