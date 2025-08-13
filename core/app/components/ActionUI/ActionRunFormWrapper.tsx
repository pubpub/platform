import type { ActionInstances, PubsId, Stages } from "db/public";
import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import type { Action, ActionInstanceOf } from "~/actions/types";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { getActionConfigDefaults } from "~/lib/server/actions";
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

	const defaultsPromise = getActionConfigDefaults(
		stage.communityId,
		actionInstance.action
	).executeTakeFirst();

	const [{ fields }, resolvedFieldConfig, defaults] = await Promise.all([
		fieldPromise,
		resolvedFieldConfigPromise,
		defaultsPromise,
	]);

	const defaultFields: string[] = defaults?.config ? Object.keys(defaults?.config) : [];

	for (const field of defaultFields) {
		let fieldConfig = resolvedFieldConfig[field];
		if (fieldConfig === undefined) {
			fieldConfig = resolvedFieldConfig[field] = {};
		}
		fieldConfig.placeholder = "(use default)";
	}

	return (
		<PubFieldProvider pubFields={fields}>
			<TokenProvider tokens={tokens}>
				<ActionRunForm
					actionInstance={actionInstance}
					pubId={pubId}
					fieldConfig={resolvedFieldConfig}
					defaultFields={defaultFields}
				/>
			</TokenProvider>
		</PubFieldProvider>
	);
};
