import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Capabilities, MembershipType } from "db/public"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"

export const metadata: Metadata = {
	title: "Community Settings",
}

export default async function Page(props: { params: Promise<{ communitySlug: string }> }) {
	const params = await props.params
	const { user } = await getPageLoginData()
	const { communitySlug } = params

	const community = await findCommunityBySlug(communitySlug)

	if (!community) {
		notFound()
	}

	if (
		!(await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		))
	) {
		redirect(`/c/${communitySlug}/unauthorized`)
	}

	return (
		<main className="flex flex-col items-start gap-y-4">
			<h1 className="font-bold text-xl">Community Settings</h1>
			<div className="prose dark:prose-invert">
				<ul>
					<li>
						<Link className="underline" href={`/c/${communitySlug}/settings/tokens`}>
							Tokens
						</Link>
					</li>
					<li>
						<Link className="underline" href={`/c/${communitySlug}/developers/docs`}>
							API Docs
						</Link>
					</li>
					{user.isSuperAdmin && (
						<li>
							<Link
								className="underline"
								href={`/c/${communitySlug}/settings/legacy-migration`}
							>
								Legacy Migration
							</Link>
						</li>
					)}
				</ul>
			</div>
		</main>
	)
}
