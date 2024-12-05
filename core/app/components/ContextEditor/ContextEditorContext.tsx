"use client";

import type { PropsWithChildren } from "react";

import { createContext, useContext, useState } from "react";

import type { ProcessedPub } from "contracts";
import type { PubsId, PubTypesId } from "db/public";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";
import { processedPubsToPubsResult } from "~/lib/pubs";

export type ContextEditorContext = {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
	pubId?: PubsId;
	pubTypeId?: PubTypesId;
};

const ContextEditorContext = createContext<ContextEditorContext>({
	pubs: [],
	pubTypes: [],
});

type InputPub = ProcessedPub<{ withStage: true; withLegacyAssignee: true; withPubType: true }>;
type Props = PropsWithChildren<
	Omit<ContextEditorContext, "pubs"> & {
		pubs: InputPub[];
	}
>;

export const ContextEditorContextProvider = (props: Props) => {
	const [cachedPubId] = useState(props.pubId);
	const { children, pubId, ...value } = props;

	const contextPubs = processedPubsToPubsResult(value.pubs);

	return (
		<ContextEditorContext.Provider value={{ ...value, pubs: contextPubs, pubId: cachedPubId }}>
			{children}
		</ContextEditorContext.Provider>
	);
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
