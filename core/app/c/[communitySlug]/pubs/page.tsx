import type { CommunitiesId } from "db/public"
import type { Metadata } from "next"

import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"
import { Button } from "ui/button"

import { MainCreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan, userCanCreateAnyPub } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"
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
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<BookOpen size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Pubs
				</ContentLayoutTitle>
				<ContentLayoutActions>
					{canEditTypes && (
						<Button variant="ghost" size="sm" asChild>
							<Link href="types">Manage Types</Link>
						</Button>
					)}
					{canCreateAnyPub && (
						<MainCreatePubButton communityId={community.id as CommunitiesId} />
					)}
				</ContentLayoutActions>
			</ContentLayoutHeader>
			<ContentLayoutBody className="overflow-hidden">
				<PaginatedPubList
					communityId={community.id}
					searchParams={searchParams}
					basePath={basePath}
					userId={user.id}
				/>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
