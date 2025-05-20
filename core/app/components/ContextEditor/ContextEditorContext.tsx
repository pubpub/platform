"use client";

import type { ContextEditorRef } from "context-editor";
import type { PropsWithChildren, RefObject } from "react";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { ProcessedPub } from "contracts";
import type { PubsId, PubTypesId } from "db/public";

import type { GetPubTypesResult } from "~/lib/server";

export type ContextEditorContext = {
	pubs: ContextEditorPub[];
	pubTypes: GetPubTypesResult;
	pubId?: PubsId;
	pubTypeId?: PubTypesId;
	registeredGetters: Record<string, RefObject<ContextEditorRef | null>>;
	registerGetter: (key: string, ref: RefObject<ContextEditorRef | null>) => void;
};

const ContextEditorContext = createContext<ContextEditorContext>({
	pubs: [],
	pubTypes: [],
	registeredGetters: {},
	registerGetter: (key: string) => {},
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

export const ContextEditorContextProvider = (
	props: Omit<Props, "registeredGetters" | "registerGetter">
) => {
	const cachedPubId = useMemo(() => {
		return props.pubId;
	}, [props.pubId]);

	const [registeredGetters, setRegisteredGetters] = useState<
		Record<string, RefObject<ContextEditorRef | null>>
	>({});

	const registerGetter = useCallback((key: string, ref: RefObject<ContextEditorRef | null>) => {
		setRegisteredGetters((prev) => ({ ...prev, [key]: ref }));
	}, []);

	const { children, pubId, pubs, ...value } = props;

	return (
		<ContextEditorContext.Provider
			value={{ ...value, pubs, pubId: cachedPubId, registeredGetters, registerGetter }}
		>
			{children}
		</ContextEditorContext.Provider>
	);
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
