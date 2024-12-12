import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { StageSelectServer } from "~/app/components/StageSelect/StageSelectServer";
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
			/>
		);
	}
);

export default component;
