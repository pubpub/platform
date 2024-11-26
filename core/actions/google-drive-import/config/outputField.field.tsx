import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { FieldOutputMap } from "../../http/config/client-components/FieldOutputMap";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ action, actionInstance, stageId, communityId }) => {
		return <FieldOutputMap context={{}} />;
	}
);

export default component;
