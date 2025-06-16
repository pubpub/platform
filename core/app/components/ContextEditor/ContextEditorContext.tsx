"use client";

import type { ContextEditorGetter } from "context-editor";
import type { PropsWithChildren, RefObject } from "react";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { ProcessedPub } from "contracts";
import type { PubsId, PubTypes, PubTypesId } from "db/public";

export type ContextEditorContext = {
	pubs: ContextEditorPub[];
	pubTypes: Pick<PubTypes, "id" | "name">[];
	pubId?: PubsId;
	pubTypeId?: PubTypesId;
	/**
	 * Refs which are able to retrieve the current state of the context editor
	 * on demand, rather than having the form state manage the value (which is slower)
	 */
	contextEditorGetters: ContextEditorGetters;
	/**
	 * Register a new context editor getter, which is able to retrieve the current state of the context editor
	 * on demand, rather than having the form state manage the value (which is slower)
	 * @param key - The key to register the getter under
	 * @param ref - The ref to the context editor
	 */
	registerGetter: (key: string, ref: ContextEditorGetterRef) => void;
};

export type ContextEditorGetterRef = RefObject<ContextEditorGetter | null>;
export type ContextEditorGetters = Record<string, ContextEditorGetterRef>;

const ContextEditorContext = createContext<ContextEditorContext>({
	pubs: [],
	pubTypes: [],
	contextEditorGetters: {},
	registerGetter: () => {},
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
	props: Omit<Props, "contextEditorGetters" | "registerGetter">
) => {
	const cachedPubId = useMemo(() => {
		return props.pubId;
	}, [props.pubId]);

	const [contextEditorGetters, setContextEditorGetters] = useState<
		Record<string, ContextEditorGetterRef>
	>({});

	const registerGetter = useCallback((key: string, ref: ContextEditorGetterRef) => {
		setContextEditorGetters((prev) => ({ ...prev, [key]: ref }));
	}, []);

	const { children, pubId, pubs, ...value } = props;

	return (
		<ContextEditorContext.Provider
			value={{
				...value,
				pubs,
				pubId: cachedPubId,
				contextEditorGetters,
				registerGetter,
			}}
		>
			{children}
		</ContextEditorContext.Provider>
	);
};

export const useContextEditorContext = () => useContext(ContextEditorContext);
