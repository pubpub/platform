"use client"

import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { toast } from "ui/use-toast"

import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient"
import { useCommunity } from "../../providers/CommunityProvider"
import { SAVE_STATUS_QUERY_PARAM } from "./constants"

export const PubEditorWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter()
	const pathname = usePathname()
	const params = useSearchParams()
	const community = useCommunity()

	const onSuccess = () => {
		toast({
			title: "Success",
			description: props.mode === "edit" ? "Pub successfully updated" : "New pub created",
		})

		const newParams = new URLSearchParams(params)
		const currentTime = `${Date.now()}`
		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime)

		if (props.mode === "edit") {
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
		} else {
			// Delete the params associated with creating a related pub
			newParams.delete("relatedPubId")
			newParams.delete("slug")
			const editPath = `/c/${community.slug}/pubs/${props.pub.id}/edit`
			router.push(`${editPath}?${newParams.toString()}`)
		}
	}

	return (
		<PubEditorClient {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient>
	)
}
