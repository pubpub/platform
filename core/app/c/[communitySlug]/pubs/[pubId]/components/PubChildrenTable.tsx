"use client";

import { useMemo } from "react";

import type { ChildPubRow, ChildPubRowPubType } from "./types";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";

type Props = {
	childPubRows: ChildPubRow[];
	childPubRunActionDropdowns: React.ReactNode[];
	childPubType?: ChildPubRowPubType;
};

export const PubChildrenTable = (props: Props) => {
	const columns = useMemo(
		() => getPubChildrenTableColumns(props.childPubRunActionDropdowns, props.childPubType),
		// When the page re-renders (e.g. the path or search params change) these
		// columns are recomputed, resulting in a new object. The DataTable
		// component does a full re-render when the object passed to the `columns`
		// prop changes. Any open dialogs or menus that are descendants of a table
		// row will be closed when this happens. To prevent this, we memoize the
		// columns object so that it only changes when the childPubType changes.
		[props.childPubType?.id]
	);
	return <DataTable columns={columns} data={props.childPubRows} hidePaginationWhenSinglePage />;
};
