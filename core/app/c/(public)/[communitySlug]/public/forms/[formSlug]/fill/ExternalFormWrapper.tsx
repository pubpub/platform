"use client"

import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
	SAVE_STATUS_QUERY_PARAM,
	SUBMIT_ID_QUERY_PARAM,
} from "~/app/components/pubs/PubEditor/constants"
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient"

export const ExternalFormWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter()
	const pathname = usePathname()
	const params = useSearchParams()
	const [pubId] = useState(props.pub.id)

	const onSuccess = ({
		submitButtonId,
		isAutoSave,
	}: {
		submitButtonId?: string
		isAutoSave: boolean
	}) => {
		const newParams = new URLSearchParams(params)
		const currentTime = `${Date.now()}`
		if (props.mode !== "edit") {
			newParams.set("pubId", pubId)
		}

		if (!isAutoSave) {
			if (submitButtonId) {
				newParams.set(SUBMIT_ID_QUERY_PARAM, submitButtonId)
			}
			router.push(`${pathname}?${newParams.toString()}`)
			return
		}
		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime)
		router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
	}

	return (
		<PubEditorClient {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient>
	)
}
