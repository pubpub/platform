"use client";

import type { PubChildrenTableRow } from "./getPubChildrenTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { PubPayload } from "~/lib/types";
import { getPubChildrenTableColumns } from "./getPubChildrenTableColumns";

type Props = {
	children: PubChildrenTableRow[];
	pubType?: PubPayload["pubType"];
};

export const PubChildrenTable = (props: Props) => {
	const columns = getPubChildrenTableColumns(props.pubType);
	return <DataTable columns={columns} data={props.children} hidePaginationWhenSinglePage />;
};
