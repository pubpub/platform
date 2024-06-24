import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ pageContext }) => {
		return (
			<UserSelectServer
				fieldName="recipient"
				fieldLabel="Recipient email address"
				query={pageContext.searchParams?.query as string | undefined}
			/>
		);
	}
);

export default component;
