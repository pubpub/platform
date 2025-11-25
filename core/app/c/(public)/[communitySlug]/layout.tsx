import type { Metadata } from "next"

import { notFound } from "next/navigation"

import { CommunityProvider } from "~/app/components/providers/CommunityProvider"
import { findCommunityBySlug } from "~/lib/server/community"

type Props = { children: React.ReactNode; params: Promise<{ communitySlug: string }> }

export async function generateMetadata(_props: {
	params: Promise<{ communitySlug: string }>
}): Promise<Metadata> {
	const community = await findCommunityBySlug()

	if (!community) {
		return { title: "Community Not Found" }
	}

	return {
		title: {
			template: `%s | ${community.name}`,
			default: `${community.name} on PubPub`,
		},
	}
}

export default async function MainLayout(props: Props) {
	const { children } = props

	const community = await findCommunityBySlug()

	if (!community) {
		return notFound()
	}

	return <CommunityProvider community={community}>{children}</CommunityProvider>
}
