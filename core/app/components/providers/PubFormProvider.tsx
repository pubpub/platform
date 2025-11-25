"use client"

import type { PubsId } from "db/public"
import type { Form } from "~/lib/server/form"

// Provides context about the current PubForm being filled out
// for form elements
import { createContext, useContext } from "react"

export type PubFormData = {
	/** Id of the Pub being created/edited */
	pubId: PubsId
	/** Form being filled out */
	form: Form
	/** Whether the form is being created or edited */
	mode: "create" | "edit"
	/** Whether it's a public or external form */
	isExternalForm: boolean
}

type Props = {
	children: React.ReactNode
	form: PubFormData
}

const PubFormContext = createContext<PubFormData | undefined>(undefined)

export function PubFormProvider({ children, form }: Props) {
	return <PubFormContext.Provider value={form}>{children}</PubFormContext.Provider>
}

export const usePubForm = () => {
	const form = useContext(PubFormContext)
	if (!form) {
		throw new Error("PubForm context used without provider")
	}
	return form
}
