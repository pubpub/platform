"use client";

import type { PropsWithChildren } from "react";

import { createContext, useContext, useState } from "react";

import type { ProcessedPub } from "contracts";
import type { PubsId, PubTypesId } from "db/public";

import type { GetPubTypesResult } from "~/lib/server";

export type ContextEditorContext = {
	pubs: ContextEditorPub[];
	pubTypes: GetPubTypesResult;
	pubId?: PubsId;
	pubTypeId?: PubTypesId;
};

const ContextEditorContext = createContext<ContextEditorContext>({
	pubs: [],
	pubTypes: [],
});

export type ContextEditorPub = ProcessedPub<{
	withStage: true;
	withPubType: true;
}>;
type Props = PropsWithChildren<
	Omit<ContextEditorContext, "pubs"> & {
		pubs: ContextEditorPub[];
	}
>;

export const ContextEditorContextProvider = (props: Props) => {
	const [cachedPubId] = useState(props.pubId);
	const { children, pubId, pubs, ...value } = props;

	return (
		<ContextEditorContext.Provider value={{ ...value, pubs, pubId: cachedPubId }}>
			{children}
		</ContextEditorContext.Provider>
	);
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
