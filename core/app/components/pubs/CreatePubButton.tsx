import type { CommunitiesId, PubsId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import { getAllPubTypesForCommunity } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { PathAwareDialog } from "../PathAwareDialog";
import { PubTypeFormClient } from "./PubTypeFormClient";

type Props = {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
	/** If specified, pubs created via this button will have this parentId */
	parentId?: PubsId;
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
	const pubTypes = await getAllPubTypesForCommunity(communitySlug).execute();
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
			<PubTypeFormClient
				pubTypes={pubTypes}
				editorSpecifiers={{
					stageId: "stageId" in props ? props.stageId : undefined,
					parentId: props.parentId,
				}}
			/>
		</PathAwareDialog>
	);
};
