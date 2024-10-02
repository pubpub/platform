import type { ActionInstances, CommunitiesId, PubsId } from "db/public";
import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import type { Action, ActionInstanceOf } from "~/actions/types";
import type { PageContext } from "~/lib/types";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { getPubFields } from "~/lib/server/pubFields";
import { ActionRunForm } from "./ActionRunForm";

export const ActionRunFormWrapper = async ({
	actionInstance,
	pubId,
	pageContext,
	communityId,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
	pageContext: PageContext;
	communityId: CommunitiesId;
}) => {
	const { tokens = {} } = getActionByName(actionInstance.action);

	const fieldPromise = getPubFields({ communityId: communityId }).executeTakeFirstOrThrow();

	const resolvedFieldConfigPromise = resolveFieldConfig(actionInstance.action, "config", {
		stageId: actionInstance.stageId,
		communityId: communityId,
		actionInstance: actionInstance as ActionInstanceOf<Action>,
		pageContext,
	});

	const [{ fields }, resolvedFieldConfig] = await Promise.all([
		fieldPromise,
		resolvedFieldConfigPromise,
	]);

	return (
		<PubFieldProvider pubFields={fields}>
			<TokenProvider tokens={tokens}>
				<ActionRunForm
					actionInstance={actionInstance}
					pubId={pubId}
					fieldConfig={resolvedFieldConfig}
				/>
			</TokenProvider>
		</PubFieldProvider>
	);
};
