import { Suspense } from "react";

import type { ActionInstances } from "db/public";

import type { StagewithConstraints } from "~/lib/stages";
import type { MemberWithUser, PubWithValues } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { AssignWrapper } from "./AssignWrapper";
import Move from "./Move";

type Props = {
	members?: MemberWithUser[];
	moveFrom: StagewithConstraints[];
	moveTo: StagewithConstraints[];
	pub: PubWithValues;
	stage: StagewithConstraints;
	actionInstances: ActionInstances[];
};

export const StagePubActions = async (props: Props) => {
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move
				pubId={props.pub.id}
				stageId={props.stage.id}
				moveTo={props.moveTo}
				moveFrom={props.moveFrom}
			/>
			<AssignWrapper pub={props.pub} members={props.members} />
			<Suspense fallback={<SkeletonButton className="w-20" />}>
				<PubsRunActionDropDownMenu
					pubId={props.pub.id}
					actionInstances={props.actionInstances}
				/>
			</Suspense>
		</div>
	);
};
