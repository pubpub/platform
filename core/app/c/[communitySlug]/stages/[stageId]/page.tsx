import type { CommunitiesId, StagesId, UsersId } from "db/public"
import type { Metadata } from "next"

import { cache, Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FlagTriangleRightIcon } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"
import { Button } from "ui/button"
import { PubFieldProvider } from "ui/pubFields"
import { StagesProvider, stagesDAO } from "ui/stages"

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { getPubFields } from "~/lib/server/pubFields"
import { getStages } from "~/lib/server/stages"
import { ContentLayout } from "../../ContentLayout"
import { PubListSkeleton } from "../../pubs/PubList"
import { StagePubs } from "../components/StageList"

const getStageCached = cache(
	async (stageId: StagesId, communityId: CommunitiesId, userId: UsersId) => {
		const [stage, canViewStage] = await Promise.all([
			getStages({ stageId, communityId, userId }).executeTakeFirst(),
			userCan(
				Capabilities.viewStage,
				{
					type: MembershipType.stage,
					stageId,
				},
				userId
			),
		])
		return { stage, canViewStage }
	}
)

export async function generateMetadata(props: {
	params: Promise<{ stageId: StagesId; communitySlug: string }>
}): Promise<Metadata> {
	const params = await props.params

	const { stageId } = params

	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!community) {
		notFound()
	}
	const { stage, canViewStage } = await getStageCached(stageId, community.id, user.id)
	if (!canViewStage) {
		return {
			title: "Unauthorized",
		}
	}

	if (!stage) {
		notFound()
	}

	return { title: `${stage.name} Stage` }
}

export default async function Page(props: {
	searchParams: Promise<Record<string, string> & { page?: string }>

	params: Promise<{ communitySlug: string; stageId: StagesId }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const { stageId } = params
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!community) {
		notFound()
	}

	const page = searchParams.page ? parseInt(searchParams.page, 10) : 1

	const stagePromise = getStageCached(stageId, community.id, user.id)
	const capabilityPromise = userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	)
	const [{ stage, canViewStage }, showEditButton, stages, pubFields] = await Promise.all([
		stagePromise,
		capabilityPromise,
		getStages({ communityId: community.id, userId: user.id }).execute(),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
	])

	if (!canViewStage) {
		return await redirectToUnauthorized()
	}

	if (!stage) {
		notFound()
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
					{stage.name}
				</>
			}
			right={
				<div className="flex items-center gap-2">
					{showEditButton && (
						<Button variant="ghost" size="sm" asChild>
							<Link
								href={`/c/${community.slug}/stages/manage?editingStageId=${stageId}`}
							>
								Edit Stage Settings
							</Link>
						</Button>
					)}
					<CreatePubButton
						text="Create Pub"
						stageId={stageId}
						className="bg-emerald-500 text-white"
						communityId={community.id}
					/>
				</div>
			}
		>
			<div className="m-4 max-w-(--breakpoint-lg)">
				<Suspense
					fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} className="gap-16" />}
				>
					<PubFieldProvider pubFields={pubFields.fields}>
						<StagesProvider stages={stagesDAO(stages)}>
							<StagePubs
								userId={user.id}
								stage={stage}
								searchParams={searchParams}
								pagination={{ page, pubsPerPage: 10 }}
								basePath={""}
							/>
						</StagesProvider>
					</PubFieldProvider>
				</Suspense>
			</div>
		</ContentLayout>
	)
}
