"use client"

import dynamic from "next/dynamic"

import { CopyButton } from "ui/copy-button"

import { useCommunity } from "~/app/components/providers/CommunityProvider"

const FormCopyButtonBase = ({ formSlug }: { formSlug: string }) => {
	const community = useCommunity()
	const link = `${window.location.origin}/c/${community.slug}/public/forms/${formSlug}/fill`
	return (
		<CopyButton className="flex h-8 w-auto gap-1 p-3" value={link}>
			<span className="sr-only md:not-sr-only">Copy link to live form</span>
		</CopyButton>
	)
}

// necessary in order to disable SSR, as window is not available on the server
export const FormCopyButton = dynamic(() => Promise.resolve(FormCopyButtonBase), { ssr: false })
