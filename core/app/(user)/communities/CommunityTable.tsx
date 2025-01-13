"use client"

import React from "react"

import type { TableCommunity } from "./getCommunityTableColumns"
import { DataTable } from "~/app/components/DataTable/DataTable"
import { getCommunityTableColumns } from "./getCommunityTableColumns"

export const CommunityTable = ({ communities }: { communities: TableCommunity[] }) => {
	const communityTableColumns = getCommunityTableColumns()
	return <DataTable columns={communityTableColumns} data={communities} searchBy="slug" />
}
