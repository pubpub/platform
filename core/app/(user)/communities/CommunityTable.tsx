"use client"

import type { TableCommunity } from "./getCommunityTableColumns"

import { useRouter } from "next/navigation"

import { DataTable } from "~/app/components/DataTable/DataTable"
import { getCommunityTableColumns } from "./getCommunityTableColumns"

export const CommunityTable = ({ communities }: { communities: TableCommunity[] }) => {
	const communityTableColumns = getCommunityTableColumns()
	const router = useRouter()
	return (
		<DataTable
			columns={communityTableColumns}
			data={communities}
			searchBy="slug"
			onRowClick={(row) => router.push(`/c/${row.original.slug}/stages`)}
		/>
	)
}
