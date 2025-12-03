import type { Metadata } from "next"

import { notFound, redirect } from "next/navigation"

import { Capabilities, MembershipType } from "db/public"
import { Activity } from "ui/icon"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { ContentLayout } from "../../ContentLayout"
import { PaginatedAutomationRunList } from "./AutomationRunList"

export const metadata: Metadata = {
	title: "Automation Logs",
}

export default async function Page(props: {
	params: Promise<{
		communitySlug: string
	}>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const [params, searchParams] = await Promise.all([props.params, props.searchParams])

	const { communitySlug } = params

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	])

	if (!community) {
		notFound()
	}

	const canEditCommunity = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	)

	if (!canEditCommunity) {
		redirect(`/c/${communitySlug}/unauthorized`)
	}

	return (
		<ContentLayout
			title={
				<>
					<Activity size={24} strokeWidth={1} className="mr-2 text-gray-500" /> Automation
					Logs
				</>
			}
		>
			<PaginatedAutomationRunList communityId={community.id} searchParams={searchParams} />
		</ContentLayout>
	)
}
