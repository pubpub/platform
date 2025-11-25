import type { DataTableProps } from "../DataTable"

import { cn } from "utils"

import { DataTable as DataTableV1 } from "../DataTable"

/**
 * Wrapper around DataTable so that some fields can use updated designs
 */
export function DataTable<TData, TValue>(
	props: Omit<
		DataTableProps<TData, TValue>,
		"emptyState" | "striped" | "hidePaginationWhenSinglePage"
	>
) {
	return (
		<DataTableV1
			{...props}
			// Render nothing on empty instead of the default
			emptyState={null}
			hidePaginationWhenSinglePage
			className={cn("border-none", props.className)}
			striped
		/>
	)
}
