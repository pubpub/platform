import { Suspense } from "react";

import type { ProcessedPub } from "contracts";
import type { ActionInstances } from "db/public";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { AssignWrapper } from "./AssignWrapper";
import Move from "./Move";

type Props = {
	members?: MemberWithUser[];
	pub: ProcessedPub<{
		withStage: true;
		withPubType: true;
		withRelatedValues: false;
		withLegacyAssignee: true;
	}>;
	stage: CommunityStage;
	actionInstances: ActionInstances[];
	pageContext: PageContext;
};

export const StagePubActions = async (props: Props) => {
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move
				pubId={props.pub.id}
				stageId={props.stage.id}
				moveFrom={props.stage.moveConstraintSources}
				moveTo={props.stage.moveConstraints}
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
