import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { action } from "../action";
import { FieldOutputMap } from "../config/client-components/FieldOutputMap";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ action, actionInstance, stageId, communityId, pubId }) => {
		return <FieldOutputMap context={{}} />;
	}
);

export default component;
