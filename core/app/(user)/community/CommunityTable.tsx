"use client";

import React from "react";

import { DataTable } from "~/app/components/DataTable";
import { getCommunityTableColumns, TableCommunity } from "./getCommunityTableColumns";

export const CommunityTable = ({
	communities,
	user,
}: {
	communities: TableCommunity[];
	user: any;
}) => {
	const communityTableColumns = getCommunityTableColumns({ user });
	return <DataTable columns={communityTableColumns} data={communities} searchBy="slug" />;
};
