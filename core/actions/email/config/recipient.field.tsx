import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelectServer";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ pageContext }) => {
		return (
			<UserSelectServer
				fieldName="recipient"
				query={pageContext.searchParams?.query as string | undefined}
			/>
		);
	}
);

export default component;
