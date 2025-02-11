import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import { getAllPubTypesForCommunity } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { PathAwareDialog } from "../PathAwareDialog";
import { InitialCreatePubForm } from "./InitialCreatePubForm";

type Props = {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
	/**
	 * If specified, pubs created via this button will be related to this relatedPub.pubId
	 * The relatedPub.pubId will gain a pub value that relates it to the newly created pub
	 */
	relatedPub?: {
		pubId: PubsId;
		pubTypeId: PubTypesId;
	};
} & (
	| {
			/** If specified, the pub editor will default to this stage */
			stageId: StagesId;
	  }
	| { communityId: CommunitiesId }
);

export const CreatePubButton = async (props: Props) => {
	const id = "stageId" in props ? props.stageId : props.communityId;

	const communitySlug = await getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		return null;
	}

	const pubTypes = await getAllPubTypesForCommunity(communitySlug).execute();
	const relatedPubFields = props.relatedPub
		? Object.values(
				(
					await getPubFields({
						pubTypeId: props.relatedPub.pubTypeId,
						communityId: community.id,
						isRelated: true,
					}).executeTakeFirstOrThrow()
				).fields
			)
		: [];

	return (
		<PathAwareDialog
			buttonSize={props.size}
			buttonText={props.text ?? "Create"}
			buttonVariant={props.variant}
			className={props.className}
			icon={<Plus size="12" className="mb-0.5" />}
			id={id}
			param="create-pub-form"
			title="Create Pub"
		>
			<InitialCreatePubForm
				pubTypes={pubTypes}
				relatedPubFields={relatedPubFields}
				editorSpecifiers={{
					stageId: "stageId" in props ? props.stageId : undefined,
					relatedPubId: props.relatedPub?.pubId,
				}}
			/>
		</PathAwareDialog>
	);
};
