"use client";

import React from "react";

import { DataTable } from "~/app/components/DataTable";
import type { UserAndMemberships } from "~/lib/types";
import type { TableCommunity } from "./getCommunityTableColumns";
import { getCommunityTableColumns } from "./getCommunityTableColumns";

export const CommunityTable = ({
	communities,
	user,
}: {
	communities: TableCommunity[];
	user: UserAndMemberships;
}) => {
	const communityTableColumns = getCommunityTableColumns({ user });
	return <DataTable columns={communityTableColumns} data={communities} searchBy="slug" />;
};
