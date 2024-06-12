"use client";

import React from "react";

import type { TablePubChild } from "./getPubChildrenTableColumns";
import { DataTable } from "~/app/components/DataTable";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";

export const PubChildrenTable = ({ communities }: { communities: TablePubChild[] }) => {
	const communityTableColumns = getPubChildrenTableColumns();
	return <DataTable columns={communityTableColumns} data={communities} searchBy="assignee" />;
};
