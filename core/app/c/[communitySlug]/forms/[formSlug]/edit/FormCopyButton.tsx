"use client"

import { CopyButton } from "ui/copy-button"

import { useCommunity } from "~/app/components/providers/CommunityProvider"

export const FormCopyButton = ({ formSlug }: { formSlug: string }) => {
	const community = useCommunity()
	const link = `${window.location.origin}/c/${community.slug}/public/forms/${formSlug}/fill`
	return (
		<CopyButton className="flex h-8 w-auto gap-1 p-3" value={link}>
			Copy link to live form
		</CopyButton>
	)
}
