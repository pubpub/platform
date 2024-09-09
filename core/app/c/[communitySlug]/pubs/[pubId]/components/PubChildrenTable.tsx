"use client";

import type { ChildPubRow, ChildPubRowPubType } from "./types";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";

type Props = {
	childPubRows: ChildPubRow[];
	childPubRunActionDropdowns: JSX.Element[];
	childPubType?: ChildPubRowPubType;
};

export const PubChildrenTable = (props: Props) => {
	const columns = getPubChildrenTableColumns(
		props.childPubRunActionDropdowns,
		props.childPubType
	);
	return <DataTable columns={columns} data={props.childPubRows} hidePaginationWhenSinglePage />;
};
