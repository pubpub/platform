"use client"

import { type ReactNode, useState } from "react"

import { SearchDialog } from "./SearchDialog"
import { SearchDialogContext, type SearchDialogContextValue } from "./SearchDialogContext"

interface SearchDialogProviderProps {
	children: ReactNode
}

export function SearchDialogProvider({ children }: SearchDialogProviderProps) {
	const [isOpen, setIsOpen] = useState(false)

	const value: SearchDialogContextValue = {
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
		isOpen,
	}

	return (
		<SearchDialogContext.Provider value={value}>
			{children}
			<SearchDialog />
		</SearchDialogContext.Provider>
	)
}
