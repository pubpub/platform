"use client";

import { DataTable } from "~/app/components/DataTable/DataTable";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";
import { ChildPubRow, ChildPubRowPubType } from "./types";

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
