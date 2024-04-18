"use client";

import React from "react";

import type { TableCommunity } from "./getCommunityTableColumns";
import type { UserAndMemberships } from "~/lib/types";
import { DataTable } from "~/app/components/DataTable";
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
