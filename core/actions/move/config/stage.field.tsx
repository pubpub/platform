import type { StagesId } from "db/public";

import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { StageSelectServer } from "~/app/components/StageSelect/StageSelectServer";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ communityId, actionInstance }) => {
		return (
			<StageSelectServer
				fieldName="stage"
				fieldLabel="Destination stage"
				communityId={communityId}
				value={actionInstance.config?.stage as StagesId}
			/>
		);
	}
);

export default component;
