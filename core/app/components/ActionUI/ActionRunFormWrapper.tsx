import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import type { PageContext } from "./PubsRunActionDropDownMenu";
import type { Action, ActionInstanceOf } from "~/actions/types";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { Stages } from "~/kysely/types/public/Stages";
import type { StagePub } from "~/lib/db/queries";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
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
	const { tokens = {} } = getActionByName(actionInstance.action);

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
		<PubFieldProvider pubFields={fields}>
			<TokenProvider tokens={tokens}>
				<ActionRunForm
					actionInstance={actionInstance}
					pub={pub}
					fieldConfig={resolvedFieldConfig}
				/>
			</TokenProvider>
		</PubFieldProvider>
	);
};
