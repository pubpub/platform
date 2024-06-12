import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelectServer";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ pageContext }) => {
		return <UserSelectServer fieldName="recipient" email={pageContext.searchParams?.email} />;
	}
);

export default component;
