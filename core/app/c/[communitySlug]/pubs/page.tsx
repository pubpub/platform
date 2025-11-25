import type { CommunitiesId } from "db/public"
import type { Metadata } from "next"

import { Suspense } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"
import { Button } from "ui/button"

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan, userCanCreateAnyPub } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { ContentLayout } from "../ContentLayout"
import { PaginatedPubList } from "./PubList"

export const metadata: Metadata = {
	title: "Pubs",
}

type Props = {
	params: Promise<{ communitySlug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page(props: Props) {
	const searchParams = await props.searchParams

	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!community) {
		return null
	}

	const [canEditTypes, canCreateAnyPub] = await Promise.all([
		await userCan(
			Capabilities.editPubType,
			{
				type: MembershipType.community,
				communityId: community.id,
			},
			user.id
		),
		userCanCreateAnyPub(user.id, community.id),
	])

	const basePath = `/c/${community.slug}/pubs`

	return (
		<ContentLayout
			title={
				<>
					<BookOpen size={24} strokeWidth={1} className="mr-2 text-gray-500" /> Pubs
				</>
			}
			right={
				<div className="flex items-center gap-x-2">
					{canEditTypes && (
						<Button variant="ghost" size="sm" asChild>
							<Link href="types">Manage Types</Link>
						</Button>
					)}
					{canCreateAnyPub && (
						<Suspense fallback={<SkeletonButton className="h-6 w-20" />}>
							<CreatePubButton
								communityId={community.id as CommunitiesId}
								className="bg-emerald-500 text-white"
							/>
						</Suspense>
					)}
				</div>
			}
			className="overflow-hidden"
		>
			<PaginatedPubList
				communityId={community.id}
				searchParams={searchParams}
				basePath={basePath}
				userId={user.id}
			/>
		</ContentLayout>
	)
}
