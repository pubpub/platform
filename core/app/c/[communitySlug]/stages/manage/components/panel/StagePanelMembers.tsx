import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "./queries";

type PropsInner = {
	stageId: string;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId);

	return <p>Member count: {members.size}</p>;
};

type Props = {
	stageId?: string;
};

export const StagePanelMembers = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelMembersInner stageId={props.stageId} />
		</Suspense>
	);
};
