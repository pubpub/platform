import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { FieldOutputMap } from "../../http/config/client-components/FieldOutputMap";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ action, actionInstance, stageId, communityId }) => {
		return (
			<FieldOutputMap
				context={{
					fieldNameOverride: "outputField",
					multiField: false,
					itemDescription: "Maps the Google Doc's content to the specified pub field.",
					title: "Output Field",
				}}
			/>
		);
	}
);

export default component;
