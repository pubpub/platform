import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStagePubs } from "./queries";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const pubs = await getStagePubs(props.stageId);

	return <p>Pub count: {pubs.length}</p>;
};

type Props = {
	stageId?: string;
};

export const StagePanelPubs = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelPubsInner stageId={props.stageId} />
		</Suspense>
	);
};
