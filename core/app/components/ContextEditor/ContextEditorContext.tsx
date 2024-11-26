"use client";

import type { PropsWithChildren } from "react";

import { createContext, useContext, useState } from "react";

import type { PubsId, PubTypesId } from "db/public";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";

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

type Props = PropsWithChildren<ContextEditorContext>;

export const ContextEditorContextProvider = (props: Props) => {
	const [cachedPubId] = useState(props.pubId);
	const { children, pubId, ...value } = props;

	return (
		<ContextEditorContext.Provider value={{ ...value, pubId: cachedPubId }}>
			{children}
		</ContextEditorContext.Provider>
	);
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
