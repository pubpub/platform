"use client"

import type { PropsWithChildren } from "react"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type FormElementToggleContext = {
	isEnabled: (fieldSlug: string) => boolean
	toggle: (fieldSlug: string) => void
}

const FormElementToggleContext = createContext<FormElementToggleContext>({
	isEnabled: () => true,
	toggle: () => {},
})

type Props = PropsWithChildren<{
	fieldSlugs: string[]
}>

export const FormElementToggleProvider = (props: Props) => {
	const [enabledFields, setEnabledFields] = useState(new Set(props.fieldSlugs))

	const isEnabled = useCallback(
		(fieldSlug: string) => {
			/**
			 * Array fields in forms will have inner values like 'croccroc:author.0.value'
			 * In this case, we'd want to see if the parent, 'croccroc:author' is enabled, not the exact inner value slug
			 */
			const arrayFieldRegex = /^(.+)\.\d+\./
			const arrayMatch = fieldSlug.match(arrayFieldRegex)
			if (arrayMatch) {
				const arrayFieldSlug = arrayMatch[1]
				return enabledFields.has(arrayFieldSlug)
			}

			return enabledFields.has(fieldSlug)
		},
		[enabledFields]
	)

	const toggle = useCallback(
		(fieldSlug: string) => {
			const nextEnabledFields = new Set(enabledFields)
			if (nextEnabledFields.has(fieldSlug)) {
				nextEnabledFields.delete(fieldSlug)
			} else {
				nextEnabledFields.add(fieldSlug)
			}
			setEnabledFields(nextEnabledFields)
		},
		[enabledFields]
	)

	const value = useMemo(() => ({ isEnabled, toggle }), [isEnabled, toggle])

	return (
		<FormElementToggleContext.Provider value={value}>
			{props.children}
		</FormElementToggleContext.Provider>
	)
}

export const useFormElementToggleContext = () => useContext(FormElementToggleContext)
