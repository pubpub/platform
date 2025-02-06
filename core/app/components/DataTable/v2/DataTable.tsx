import type { DataTableProps } from "../DataTable";
import { DataTable as DataTableV1 } from "../DataTable";

/**
 * Wrapper around DataTable so that some fields can use updated designs
 */
export function DataTable<TData, TValue>(
	props: Pick<
		DataTableProps<TData, TValue>,
		"columns" | "data" | "onRowClick" | "selectedRows" | "setSelectedRows" | "getRowId"
	>
) {
	return (
		<DataTableV1
			{...props}
			// Render nothing on empty instead of the default
			emptyState={<></>}
			hidePaginationWhenSinglePage
			className="border-none"
			striped
		/>
	);
}
