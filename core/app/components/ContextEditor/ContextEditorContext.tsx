"use client"

import type { ContextEditorGetter } from "context-editor"
import type { ProcessedPub } from "contracts"
import type { PubsId, PubTypes, PubTypesId } from "db/public"
import type { PropsWithChildren, RefObject } from "react"
import type { DefinitelyHas } from "utils/types"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type ContextEditorContext = {
	// pubs: ContextEditorPub[]
	pubTypes: Pick<PubTypes, "id" | "name">[]
	pubId: PubsId | null
	pubTypeId: PubTypesId | null
	/**
	 * Refs which are able to retrieve the current state of the context editor
	 * on demand, rather than having the form state manage the value (which is slower)
	 */
	contextEditorGetters: ContextEditorGetters
	/**
	 * Register a new context editor getter, which is able to retrieve the current state of the context editor
	 * on demand, rather than having the form state manage the value (which is slower)
	 * @param key - The key to register the getter under
	 * @param ref - The ref to the context editor
	 */
	registerGetter: (key: string, ref: ContextEditorGetterRef) => void
}

export type ContextEditorGetterRef = RefObject<ContextEditorGetter | null>
export type ContextEditorGetters = Record<string, ContextEditorGetterRef>

const ContextEditorContext = createContext<ContextEditorContext>({
	// pubs: [],
	pubTypes: [],
	pubId: null,
	pubTypeId: null,
	contextEditorGetters: {},
	registerGetter: () => {},
})

export type ContextEditorPub = ProcessedPub<{
	withStage: true
	withPubType: true
}>
type Props = PropsWithChildren<ContextEditorContext>

export const ContextEditorContextProvider = (
	props: DefinitelyHas<
		Omit<Props, "contextEditorGetters" | "registerGetter">,
		"pubId" | "pubTypeId"
	>
) => {
	const { children, pubId, ...value } = props
	const cachedPubId = useMemo(() => {
		return pubId
	}, [])

	const [contextEditorGetters, setContextEditorGetters] = useState<
		Record<string, ContextEditorGetterRef>
	>({})

	const registerGetter = useCallback((key: string, ref: ContextEditorGetterRef) => {
		setContextEditorGetters((prev) => ({ ...prev, [key]: ref }))
	}, [])

	return (
		<ContextEditorContext.Provider
			value={{
				...value,
				pubId: cachedPubId,
				contextEditorGetters,
				registerGetter,
			}}
		>
			{children}
		</ContextEditorContext.Provider>
	)
}

export const useContextEditorContext = () => useContext(ContextEditorContext)
