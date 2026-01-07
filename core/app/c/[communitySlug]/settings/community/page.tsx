import { notFound } from "next/navigation"
import { Settings } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { ContentLayout } from "../../ContentLayout"
import { CommunitySettingsForm } from "./CommunitySettingsForm"

type Props = {
	params: Promise<{ communitySlug: string }>
}

export default async function Page(props: Props) {
	const params = await props.params
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!user) {
		redirectToLogin()
	}

	if (!community) {
		notFound()
	}

	const loginData = await getPageLoginData()

	const userCanEditCommunity = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	)

	if (!userCanEditCommunity) {
		return await redirectToUnauthorized()
	}

	return (
		<ContentLayout
			title={
				<>
					<Settings size={20} strokeWidth={1} className="mr-2 text-muted-foreground" />
					Community Settings
				</>
			}
		>
			<div className="container ml-0 max-w-(--breakpoint-md) px-4 py-6 md:px-6">
				<p className="mb-6 text-accent-foreground">
					Configure your community settings, manage your branding, and control access to
					your community.
				</p>
				<CommunitySettingsForm community={community} communitySlug={params.communitySlug} />
			</div>
		</ContentLayout>
	)
}
