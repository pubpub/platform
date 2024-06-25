import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { db } from "~/kysely/database";
import { UsersId } from "~/kysely/types/public/Users";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ pageContext, actionInstance, communityId }) => {
		const community = await db
			.selectFrom("communities")
			.selectAll()
			.where("id", "=", communityId)
			.executeTakeFirstOrThrow();

		return (
			<UserSelectServer
				fieldName="recipient"
				fieldLabel="Recipient email address"
				community={community}
				query={pageContext.searchParams?.query as string | undefined}
				value={actionInstance.config.recipient as UsersId}
			/>
		);
	}
);

export default component;
