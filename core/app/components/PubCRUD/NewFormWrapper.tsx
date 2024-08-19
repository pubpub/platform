import type { CreatePubProps } from "./types";
import { db } from "~/kysely/database";
import { GenericDynamicPubForm } from "./NewForm";
import { getCommunityById, getStage } from "./queries";

type Props = CreatePubProps & { searchParams?: Record<string, unknown> };

async function GenericDynamicPubFormWrapper(props: Props) {
	// render a pubType select
	// render a stage select
	// render the fields on the selected pubType first
	// itereate over selected pubType to create elemenets and pass them to FormElement.
	// return <div></div>;
	// create an in memory representaion of a form element
	const query = props.stageId
		? getStage(props.stageId).executeTakeFirstOrThrow()
		: getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				props.communityId
			).executeTakeFirstOrThrow();

	const result = await query;

	const { community, ...stage } = "communityId" in result ? result : { community: result };

	const currentStage = "id" in stage ? stage : null;

	if (!community) {
		return null;
	}
	return (
		<>
			<GenericDynamicPubForm
				currentStage={currentStage}
				communityId={community.id}
				availableStages={community.stages}
				availablePubTypes={community.pubTypes}
				parentId={props.parentId}
			/>
		</>
	);
}

export { GenericDynamicPubFormWrapper };
