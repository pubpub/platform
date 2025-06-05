import type { ActionInstances, PubsId, Stages } from "db/public";
import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import type { Action, ActionInstanceOf } from "~/actions/types";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { getPubFields } from "~/lib/server/pubFields";
import { ActionRunForm } from "./ActionRunForm";

export const ActionRunFormWrapper = async ({
	actionInstance,
	pubId,
	stage,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
	stage: Stages;
}) => {
	const { tokens = {} } = getActionByName(actionInstance.action);

	const fieldPromise = getPubFields({ communityId: stage.communityId }).executeTakeFirstOrThrow();

	const resolvedFieldConfigPromise = resolveFieldConfig(actionInstance.action, "config", {
		stageId: stage.id,
		communityId: stage.communityId,
		actionInstance: actionInstance as ActionInstanceOf<Action>,
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
