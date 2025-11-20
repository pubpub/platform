"use client"

import type { PubFields, PubFieldsId } from "db/public"
import type React from "react"

import { createContext, useContext } from "react"

export type PubField = Pick<
	PubFields,
	"id" | "name" | "slug" | "schemaName" | "pubFieldSchemaId" | "isArchived" | "isRelation"
>
export type PubFieldContext = Record<PubFieldsId, PubField>

type Props = {
	children: React.ReactNode
	pubFields: PubFieldContext
}

const PubFieldContext = createContext<PubFieldContext | null>(null)

export function PubFieldProvider({ children, pubFields }: Props) {
	return <PubFieldContext.Provider value={pubFields}>{children}</PubFieldContext.Provider>
}

export const usePubFieldContext = () => {
	const context = useContext(PubFieldContext)
	if (!context) {
		throw new Error("usePubFieldContext must be used within a PubFieldProvider")
	}
	return context
}
