"use client";

import React from "react";

import type { PubChild } from "./getPubChildrenTableColumns";
import { DataTable } from "~/app/components/DataTable";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";

export const PubChildrenTable = ({ children }: { children: PubChild[] }) => {
	const communityTableColumns = getPubChildrenTableColumns();
	return <DataTable columns={communityTableColumns} data={children}/>;
};
