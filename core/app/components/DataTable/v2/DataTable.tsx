import type { DataTableProps } from "../DataTable";
import { DataTable as DataTableV1 } from "../DataTable";

/**
 * Wrapper around DataTable so that some fields can use updated designs
 */
export function DataTable<TData, TValue>({
	columns,
	data,
	onRowClick,
}: Pick<DataTableProps<TData, TValue>, "columns" | "data" | "onRowClick">) {
	return (
		<DataTableV1
			columns={columns}
			data={data}
			onRowClick={onRowClick}
			hidePaginationWhenSinglePage
			className="border-none"
		/>
	);
}
