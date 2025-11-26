import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "ui/button"
import { FlagTriangleRightIcon } from "ui/icon"

import { MainCreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCanViewStagePage } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { ContentLayout } from "../ContentLayout"
import { StageList } from "./components/StageList"

export const metadata: Metadata = {
	title: "Workflows",
}

type Props = { params: Promise<{ communitySlug: string }>; searchParams: Record<string, unknown> }

export default async function Page(props: Props) {
	const searchParams = await props.searchParams
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!user) {
		redirectToLogin()
	}

	if (!community) {
		notFound()
	}

	const userCanSeeStage = await userCanViewStagePage(user.id, community.id)

	if (!userCanSeeStage) {
		return await redirectToUnauthorized()
	}

	return (
		<ContentLayout
			title={
				<>
					<FlagTriangleRightIcon
						size={20}
						strokeWidth={1}
						className="mr-2 text-gray-500"
					/>
					Stages
				</>
			}
			right={
				<div className="flex items-center gap-4">
					<Button asChild variant="link" className="text-sm underline">
						<Link href={`/c/${community.slug}/stages/manage`}>Manage</Link>
					</Button>
					<MainCreatePubButton communityId={community.id} text="Add Pub" />
				</div>
			}
		>
			<div className="m-4 max-w-(--breakpoint-lg)">
				<StageList
					userId={user.id}
					communityId={community.id}
					searchParams={searchParams}
				/>
			</div>
		</ContentLayout>
	)
}
