import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import type { GetPubTypesResult } from "~/lib/server";
import { getLoginData } from "~/lib/authentication/loginData";
import { getPubsWithRelatedValues, getPubTypesForCommunity } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { ContextEditorContextProvider } from "../ContextEditor/ContextEditorContext";
import { PathAwareDialog } from "../PathAwareDialog";
import { InitialCreatePubForm } from "./InitialCreatePubForm";

type RelatedPubData = {
	pubId: PubsId;
	pubTypeId: PubTypesId;
};

/**
 * Wrapper around InitialCreatePubForm which includes queries for everything that might
 * be needed for adding a related pub value
 */
const InitialCreatePubFormWithRelatedPub = async ({
	relatedPub,
	pubTypes,
	communityId,
	stageId,
}: {
	relatedPub: RelatedPubData;
	pubTypes: GetPubTypesResult;
	communityId: CommunitiesId;
	stageId?: StagesId;
}) => {
	const { user } = await getLoginData();
	const [pubs, pubFieldsResponse] = await Promise.all([
		getPubsWithRelatedValues(
			{ communityId: communityId, userId: user?.id },
			{
				limit: 30,
				withStage: true,
				withLegacyAssignee: true,
				withPubType: true,
			}
		),
		getPubFields({
			pubTypeId: relatedPub.pubTypeId,
			communityId: communityId,
			isRelated: true,
		}).executeTakeFirstOrThrow(),
	]);

	const pubFields = Object.values(pubFieldsResponse.fields);

	return (
		<ContextEditorContextProvider
			pubId={relatedPub.pubId}
			pubTypes={pubTypes}
			pubs={pubs}
			pubTypeId={relatedPub.pubTypeId}
		>
			<InitialCreatePubForm
				pubTypes={pubTypes}
				relatedPubFields={pubFields}
				stageId={stageId}
				relatedPubId={relatedPub.pubId}
			/>
		</ContextEditorContextProvider>
	);
};

type Props = {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
	/**
	 * If specified, pubs created via this button will be related to this relatedPub.pubId
	 * The relatedPub.pubId will gain a pub value that relates it to the newly created pub
	 */
	relatedPub?: RelatedPubData;
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

	const pubTypes = await getPubTypesForCommunity(community.id, { limit: 0 });
	const stageId = "stageId" in props ? props.stageId : undefined;

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
			{props.relatedPub ? (
				<InitialCreatePubFormWithRelatedPub
					pubTypes={pubTypes}
					relatedPub={props.relatedPub}
					communityId={community.id}
					stageId={stageId}
				/>
			) : (
				<InitialCreatePubForm pubTypes={pubTypes} relatedPubFields={[]} stageId={stageId} />
			)}
		</PathAwareDialog>
	);
};
