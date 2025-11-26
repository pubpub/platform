import type { ProcessedPub } from "contracts"
import type { CommunitiesId, UsersId } from "db/public"
import type { MemberWithUser } from "~/lib/types"

import { Suspense } from "react"
import Link from "next/link"
import { Eye } from "lucide-react"

import { AutomationEvent } from "db/public"
import { Card, CardContent, CardHeader, CardTitle } from "ui/card"
import { Pencil } from "ui/icon"
import { PubFieldProvider } from "ui/pubFields"
import { StagesProvider, stagesDAO } from "ui/stages"

import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu"
import { BasicPagination } from "~/app/components/Pagination"
import { PubCard } from "~/app/components/pubs/PubCard/PubCard"
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities"
import { getStageAutomations } from "~/lib/db/queries"
import { getPubsWithRelatedValues } from "~/lib/server"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { selectAllCommunityMemberships } from "~/lib/server/member"
import { getPubFields } from "~/lib/server/pubFields"
import { type CommunityStage, getStages } from "~/lib/server/stages"
import { getOrderedStages } from "~/lib/stages"
import { PubListSkeleton } from "../../pubs/PubList"

type Props = {
	userId: UsersId
	communityId: CommunitiesId
	searchParams: Record<string, unknown>
}

export async function StageList(props: Props) {
	const { communityId, userId } = props
	const [communityStages, communityMembers, pubFields] = await Promise.all([
		getStages({ communityId, userId }).execute(),
		selectAllCommunityMemberships({ communityId }).execute(),
		getPubFields({ communityId }).executeTakeFirstOrThrow(),
	])

	const stages = getOrderedStages(communityStages)

	return (
		<div className="flex flex-col gap-8">
			<PubFieldProvider pubFields={pubFields.fields}>
				<StagesProvider stages={stagesDAO(stages)}>
					{stages.map((stage) => (
						<StageCard
							userId={props.userId}
							key={stage.id}
							stage={stage}
							members={communityMembers}
							searchParams={props.searchParams}
						/>
					))}
				</StagesProvider>
			</PubFieldProvider>
		</div>
	)
}

async function StageCard({
	stage,
	searchParams,
	members,
	userId,
}: {
	stage: CommunityStage
	members?: MemberWithUser[]
	searchParams: Record<string, unknown>
	userId: UsersId
}) {
	const communitySlug = await getCommunitySlug()

	return (
		<Card
			key={stage.id}
			className="relative flex flex-col justify-between gap-2 rounded-l-none border-0 border-border border-b-0 border-l-6 py-2 shadow-none"
		>
			<CardHeader className="!pb-2 my-1 flex items-center justify-between">
				<CardTitle className="flex items-baseline gap-3">
					<Link
						href={`/c/${communitySlug}/stages/${stage.id}`}
						className="group hover:underline"
					>
						<h3 className="font-semibold transition-colors group-hover:text-blue-600">
							{stage.name}
						</h3>
					</Link>
					<p className="mt-1 text-muted-foreground text-xs">
						{stage.pubsCount === 0
							? "No Pubs in this stage"
							: `${stage.pubsCount} ${stage.pubsCount === 1 ? "Pub" : "Pubs"}`}
					</p>
				</CardTitle>
				<EllipsisMenu>
					<EllipsisMenuButton asChild>
						<Link href={`/c/${communitySlug}/stages/manage?editingStageId=${stage.id}`}>
							Edit Stage
							<Pencil size={10} strokeWidth={1.5} />
						</Link>
					</EllipsisMenuButton>
					<EllipsisMenuButton asChild>
						<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
							View Stage
							<Eye size={10} strokeWidth={1.5} />
						</Link>
					</EllipsisMenuButton>
				</EllipsisMenu>
			</CardHeader>

			{!!stage.pubsCount && stage.pubsCount > 0 && (
				<CardContent>
					<Suspense
						fallback={
							<PubListSkeleton
								amount={stage.pubsCount < 3 ? stage.pubsCount : 3}
								className="gap-4"
							/>
						}
					>
						<StagePubs
							userId={userId}
							stage={stage}
							searchParams={searchParams}
							members={members}
							totalPubLimit={3}
							basePath={`/c/${communitySlug}/stages`}
						/>
					</Suspense>
				</CardContent>
			)}
		</Card>
	)
}

export async function StagePubs({
	stage,
	searchParams,
	totalPubLimit,
	basePath,
	pagination,
	userId,
}: {
	stage: CommunityStage
	searchParams: Record<string, unknown>
	members?: MemberWithUser[]
	totalPubLimit?: number
	pagination?: { page: number; pubsPerPage: number }
	basePath: string
	userId: UsersId
}) {
	const [
		communitySlug,
		stagePubs,
		manualAutomations,
		canEditAllPubs,
		canArchiveAllPubs,
		canRunActionsAllPubs,
		canMoveAllPubs,
		canViewAllStages,
	] = await Promise.all([
		getCommunitySlug(),
		getPubsWithRelatedValues(
			{ stageId: [stage.id], communityId: stage.communityId },
			{
				// fetch one extra pub so we know whether or not to render a show more button
				limit: pagination?.pubsPerPage || (totalPubLimit && totalPubLimit + 1),
				offset: pagination && (pagination.page - 1) * pagination.pubsPerPage,
				orderBy: "updatedAt",
				withRelatedPubs: false,
				withValues: false,
				withStage: true,
				withPubType: true,
				withStageActionInstances: true,
			}
		),
		getStageAutomations(stage.id, { event: AutomationEvent.manual }),
		userCanEditAllPubs(),
		userCanArchiveAllPubs(),
		userCanRunActionsAllPubs(),
		userCanMoveAllPubs(),
		userCanViewAllStages(),
	])

	const totalPages =
		stage.pubsCount && pagination ? Math.ceil(stage.pubsCount / pagination.pubsPerPage) : 0

	return (
		<div className="flex flex-col gap-3">
			{stagePubs.map((pub, index) => {
				if (totalPubLimit && index > totalPubLimit - 1) {
					return null
				}
				// this way we don't pass unecessary data to the client
				return (
					<PubCard
						key={pub.id}
						pub={
							pub as ProcessedPub<{
								withStage: true
								withPubType: true
								withRelatedPubs: false
							}>
						}
						moveFrom={stage.moveConstraintSources}
						moveTo={stage.moveConstraints}
						manualAutomations={manualAutomations}
						communitySlug={communitySlug}
						withSelection={false}
						userId={userId}
						canEditAllPubs={canEditAllPubs}
						canArchiveAllPubs={canArchiveAllPubs}
						canRunActionsAllPubs={canRunActionsAllPubs}
						canMoveAllPubs={canMoveAllPubs}
						canViewAllStages={canViewAllStages}
						canFilter={false}
					/>
				)
			})}
			{pagination && (
				<BasicPagination
					basePath={basePath}
					searchParams={searchParams}
					page={pagination.page}
					totalPages={totalPages}
				/>
			)}
			{!pagination &&
				stage.pubsCount &&
				totalPubLimit &&
				stagePubs.length > totalPubLimit && (
					<div className="flex items-center justify-center pt-2">
						<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
							<div className="group flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 transition-all hover:bg-muted-foreground/50">
								<div className="flex gap-1">
									<div className="size-1.5 rounded-full bg-muted-foreground"></div>
									<div className="size-1.5 rounded-full bg-muted-foreground"></div>
									<div className="size-1.5 rounded-full bg-muted-foreground"></div>
								</div>
								<span className="text-muted-foreground text-xs">
									{stage.pubsCount - totalPubLimit} more
								</span>
							</div>
						</Link>
					</div>
				)}
		</div>
	)
}
