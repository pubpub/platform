import type { PageContext } from "./PubsRunActionDropDownMenu";
import type { Action, ActionInstanceOf } from "~/actions/types";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { Stages } from "~/kysely/types/public/Stages";
import type { StagePub } from "~/lib/db/queries";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { FieldsProvider } from "~/app/c/[communitySlug]/types/FieldsProvider";
import { getPubFields } from "~/lib/server/pubFields";
import { ActionRunForm } from "./ActionRunForm";

export const ActionRunFormWrapper = async ({
	actionInstance,
	pub,
	stage,
	pageContext,
}: {
	actionInstance: ActionInstances;
	pub: StagePub;
	stage: Stages;
	pageContext: PageContext;
}) => {
	const fieldsPromise = getPubFields({ pubId: pub.id as PubsId }).executeTakeFirstOrThrow();

	const resolvedFieldConfigPromise = resolveFieldConfig(actionInstance.action, "params", {
		pubId: pub.id as PubsId,
		stageId: stage.id,
		communityId: pub.communityId as CommunitiesId,
		actionInstance: actionInstance as ActionInstanceOf<Action>,
		pageContext,
	});

	const [{ fields }, resolvedFieldConfig] = await Promise.all([
		fieldsPromise,
		resolvedFieldConfigPromise,
	]);

	return (
		<FieldsProvider fields={fields}>
			<ActionRunForm
				actionInstance={actionInstance}
				pub={pub}
				fieldConfig={resolvedFieldConfig}
			/>
		</FieldsProvider>
	);
};
