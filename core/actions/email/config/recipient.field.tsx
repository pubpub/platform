import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { UsersId } from "~/kysely/types/public/Users";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ pageContext, actionInstance }) => {
		return (
			<UserSelectServer
				fieldName="recipient"
				fieldLabel="Recipient email address"
				query={pageContext.searchParams?.query as string | undefined}
				value={actionInstance.config.recipient as UsersId}
			/>
		);
	}
);

export default component;
