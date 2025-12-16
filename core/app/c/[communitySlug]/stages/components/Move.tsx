import type { PubsId, StagesId } from "db/public"
import type { ReactNode } from "react"
import type { XOR } from "utils/types"
import type { CommunityStage } from "~/lib/server/stages"

import { Suspense } from "react"

import { Capabilities, MembershipType } from "db/public"

import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { getStage } from "~/lib/db/queries"
import { makeStagesById } from "~/lib/stages"
import { BasicMoveButton } from "./BasicMoveButton"
import { MoveInteractive } from "./MoveInteractive"

type Props = {
	pubId: PubsId
	stageId: StagesId
	button?: ReactNode
	/**
	 * If there are no source or destinations from the current stage, hide this component.
	 * @default true
	 */
	hideIfNowhereToMove?: boolean
	stageName?: string
	/* if true, overrides the move pub capability check */
	canMoveAllPubs?: boolean
	/* if true, overrides the view stage capability check */
	canViewAllStages?: boolean
} & XOR<
	{ communityStages: CommunityStage[] },
	{
		moveFrom: CommunityStage["moveConstraintSources"] | null
		moveTo: CommunityStage["moveConstraints"] | null
	}
>

const makeSourcesAndDestinations = ({ ...props }: Props) => {
	if (!props.communityStages) {
		return {
			sources: props.moveFrom,
			destinations: props.moveTo,
		}
	}

	const stagesById = makeStagesById(props.communityStages)
	const stage = stagesById[props.stageId]
	const sources = stage ? stage.moveConstraintSources.map((mc) => stagesById[mc.id]) : []
	const destinations = stage ? stage.moveConstraints.map((mc) => stagesById[mc.id]) : []

	return {
		sources,
		destinations,
	}
}

const getStageDisplayName = (props: Props) => {
	if (props.stageName) {
		return props.stageName
	}

	if (!props.communityStages) {
		return "Stage"
	}

	const stagesById = makeStagesById(props.communityStages)
	const stage = stagesById[props.stageId]
	return stage?.name || "Stage"
}

async function MoveButton({ hideIfNowhereToMove = true, ...props }: Props) {
	const stageName = getStageDisplayName(props)
	const loginData = await getLoginData()

	if (!loginData.user) {
		return <BasicMoveButton name={stageName} />
	}

	const { moveConstraints: moveFrom, moveConstraintSources: moveTo } =
		props.moveFrom && props.moveTo
			? { moveConstraints: props.moveTo, moveConstraintSources: props.moveFrom }
			: ((await getStage(props.stageId, loginData.user.id).executeTakeFirst()) ?? {})

	const { sources, destinations } = makeSourcesAndDestinations({
		...props,
		moveFrom,
		moveTo,
	} as Props)

	if (destinations?.length === 0 && sources?.length === 0 && hideIfNowhereToMove) {
		return <BasicMoveButton name={stageName} />
	}

	const [canMovePub, canViewStage] = await Promise.all([
		props.canMoveAllPubs ||
			userCan(
				Capabilities.movePub,
				{ type: MembershipType.pub, pubId: props.pubId },
				loginData.user.id
			),
		props.canViewAllStages ||
			userCan(
				Capabilities.viewStage,
				{ type: MembershipType.stage, stageId: props.stageId },
				loginData.user.id
			),
	])

	if (!canMovePub && !canViewStage) {
		return <BasicMoveButton name={stageName} />
	}

	const stageButton = props.button ?? <BasicMoveButton name={stageName} withDropdown={true} />

	return (
		<MoveInteractive
			{...props}
			sources={sources ?? []}
			destinations={destinations ?? []}
			canMovePub={canMovePub}
			canViewStage={canViewStage}
			button={stageButton}
			hideIfNowhereToMove={hideIfNowhereToMove}
		/>
	)
}

export default function Move({ hideIfNowhereToMove = true, ...props }: Props) {
	return (
		<Suspense fallback={<BasicMoveButton name={getStageDisplayName(props)} />}>
			<MoveButton hideIfNowhereToMove={hideIfNowhereToMove} {...props} />
		</Suspense>
	)
}
