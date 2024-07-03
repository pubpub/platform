import type { PageContext } from "./PubsRunActionDropDownMenu";
import type { Action, ActionInstanceOf } from "~/actions/types";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { FieldsProvider } from "~/app/c/[communitySlug]/types/FieldsProvider";
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
		<FieldsProvider fields={fields}>
			<ActionConfigForm
				instance={actionInstance}
				communityId={stage.communityId}
				actionName={actionInstance.action}
				fieldConfig={resolvedFieldConfig}
			/>
		</FieldsProvider>
	);
};
