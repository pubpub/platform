import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { db } from "~/kysely/database";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ pageContext, communityId }) => {
		const community = await db
			.selectFrom("communities")
			.selectAll()
			.where("id", "=", communityId)
			.executeTakeFirstOrThrow();

		return (
			<UserSelectServer
				fieldName="recipient"
				fieldLabel="Recipient email address"
				query={pageContext.searchParams?.query as string | undefined}
				community={community}
			/>
		);
	}
);

export default component;
