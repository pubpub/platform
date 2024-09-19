import { Suspense } from "react";

import type { ActionInstances } from "db/public";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { StagePayloadMoveConstraintDestination } from "~/lib/server/_legacy-integration-queries";
import type { StageThingy } from "~/lib/stages";
import type { MemberWithUser, PubWithValues } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { AssignWrapper } from "./AssignWrapper";
import Move from "./Move";

type Props = {
	members?: MemberWithUser[];
	moveFrom: StagePayloadMoveConstraintDestination[];
	moveTo: StagePayloadMoveConstraintDestination[];
	pub: PubWithValues;
	stage: StageThingy;
	actionInstances: ActionInstances[];
	pageContext: PageContext;
};

export const StagePubActions = async (props: Props) => {
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move
				pub={props.pub}
				stage={props.stage}
				moveTo={props.moveTo}
				moveFrom={props.moveFrom}
			/>
			<AssignWrapper pub={props.pub} members={props.members} />
			<Suspense fallback={<SkeletonButton className="w-20" />}>
				<PubsRunActionDropDownMenu
					pubId={props.pub.id}
					actionInstances={props.actionInstances}
					pageContext={props.pageContext}
					stage={props.stage}
				/>
			</Suspense>
		</div>
	);
};
