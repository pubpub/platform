import type { CreateTokenFormContext } from "db/types"
import type { Metadata } from "next"

import { notFound } from "next/navigation"
import { Key } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"
import { NO_STAGE_OPTION } from "db/types"
import { cn } from "utils"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { getAllPubTypesForCommunity } from "~/lib/server"
import { getApiAccessTokensByCommunity } from "~/lib/server/apiAccessTokens"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { getStages } from "~/lib/server/stages"
import { ContentLayout } from "../../ContentLayout"
import { CreateTokenButton } from "./CreateTokenButton"
import { ExistingToken } from "./ExistingToken"

export const metadata: Metadata = {
	title: "API Access Tokens",
}

export default async function Page(_props: { params: { communitySlug: string } }) {
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!user) {
		redirectToLogin()
	}

	if (!community) {
		return notFound()
	}

	const [canEditCommunity, stages, pubTypes, existingTokens] = await Promise.all([
		userCan(
			Capabilities.editCommunity,
			{
				communityId: community.id,
				type: MembershipType.community,
			},
			user.id
		),
		getStages({ communityId: community.id, userId: user.id }).execute(),
		getAllPubTypesForCommunity(community.slug).execute(),
		getApiAccessTokensByCommunity(community.id).execute(),
	])

	if (!canEditCommunity) {
		return await redirectToUnauthorized()
	}

	const stagesOptions = {
		stages,
		allOptions: [
			NO_STAGE_OPTION,
			...stages.map((stage) => ({
				label: stage.name,
				value: stage.id,
			})),
		],
		allValues: [NO_STAGE_OPTION.value, ...stages.map((stage) => stage.id)],
	} satisfies CreateTokenFormContext["stages"]

	const pubTypesOptions = {
		pubTypes,
		allOptions: pubTypes.map((pubType) => ({
			label: pubType.name,
			value: pubType.id,
		})),
		allValues: pubTypes.map((pubType) => pubType.id),
	} satisfies CreateTokenFormContext["pubTypes"]

	return (
		<ContentLayout
			title={
				<>
					<Key size={24} strokeWidth={1} className="mr-2 text-gray-500" /> API Tokens
				</>
			}
			right={<CreateTokenButton stages={stagesOptions} pubTypes={pubTypesOptions} />}
		>
			<div className="m-4">
				<div className="grid gap-6">
					{existingTokens.length > 0 ? (
						<div className="overflow-auto">
							{existingTokens.map((token, idx) => (
								<ExistingToken
									key={token.id}
									token={token}
									className={cn(
										idx < existingTokens.length - 1 && "rounded-b-none",
										existingTokens[idx - 1] && "rounded-t-none border-t-0"
									)}
								/>
							))}
						</div>
					) : (
						<div className="mt-20 flex flex-col items-center gap-2">
							<p className="text-center font-semibold">
								You don't have any API tokens yet
							</p>
							<p className="mb-4 text-center text-sm">
								Create one to get started interacting with Platform's API
							</p>
							<CreateTokenButton stages={stagesOptions} pubTypes={pubTypesOptions} />
						</div>
					)}
				</div>
			</div>
		</ContentLayout>
	)
}
