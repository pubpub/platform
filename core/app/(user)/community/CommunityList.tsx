"use client";

import React from "react";
import {DataTable} from "~/app/components/DataTable";

import { getCommunityTableColumns, TableCommunity } from "./getCommunityTableColumns";

export const CommunityTable = ({communities}:{communities: TableCommunity[]}) => {
    const communityTableColumns = getCommunityTableColumns();
    return <DataTable columns={communityTableColumns} data={communities} searchBy="slug"/>;
}
