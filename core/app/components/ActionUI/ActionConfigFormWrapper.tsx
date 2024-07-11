import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import type { PageContext } from "./PubsRunActionDropDownMenu";
import type { Action, ActionInstanceOf } from "~/actions/types";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { getPubFields } from "~/lib/server/pubFields";
import { ActionConfigForm } from "./ActionConfigForm";

export const ActionConfigFormWrapper = async ({
	stage,
	actionInstance,
	pageContext,
}: {
	stage: {
		id: StagesId;
		name: string;
		order: string;
		communityId: CommunitiesId;
		createdAt: Date;
		updatedAt: Date;
	};
	actionInstance: ActionInstances;
	pageContext: PageContext;
}) => {
	const { tokens = {} } = getActionByName(actionInstance.action);

	const fieldPromise = getPubFields().executeTakeFirstOrThrow();

	const resolvedFieldConfigPromise = resolveFieldConfig(actionInstance.action, "config", {
		stageId: stage.id,
		communityId: stage.communityId,
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
				<ActionConfigForm
					instance={actionInstance}
					communityId={stage.communityId}
					actionName={actionInstance.action}
					fieldConfig={resolvedFieldConfig}
				/>
			</TokenProvider>
		</PubFieldProvider>
	);
};
