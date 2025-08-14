import { CoreSchemaType } from "db/public";

import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { action } from "../action";
import OutputField from "../OutputField";

const component = defineActionFormFieldServerComponent(action, "config", async () => {
	return (
		<OutputField
			context={{
				allowedSchemaTypes: [CoreSchemaType.String],
			}}
		/>
	);
});

export default component;
