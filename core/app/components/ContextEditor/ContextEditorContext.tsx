"use client";

import type { PropsWithChildren } from "react";

import { createContext, useContext } from "react";

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
	const { children, ...value } = props;

	return <ContextEditorContext.Provider value={value}>{children}</ContextEditorContext.Provider>;
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
