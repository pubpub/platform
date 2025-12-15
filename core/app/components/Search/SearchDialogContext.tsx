"use client"

import { createContext, useContext } from "react"

export interface SearchDialogContextValue {
	open: () => void
	close: () => void
	isOpen: boolean
}

export const SearchDialogContext = createContext<SearchDialogContextValue | null>(null)

export function useSearchDialog() {
	const context = useContext(SearchDialogContext)

	if (!context) {
		throw new Error("useSearchDialog must be used within SearchDialogProvider")
	}

	return context
}
