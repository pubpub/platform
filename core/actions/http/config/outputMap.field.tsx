import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { action } from "../action";
import { FieldOutputMap } from "./client-components/FieldOutputMap";

const component = defineActionFormFieldServerComponent(action, "config", async () => {
	return <FieldOutputMap context={{}} />;
});

export default component;
