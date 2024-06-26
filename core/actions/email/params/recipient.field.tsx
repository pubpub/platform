import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { db } from "~/kysely/database";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ pageContext, communityId, actionInstance }) => {
		const community = await db
			.selectFrom("communities")
			.selectAll()
			.where("id", "=", communityId)
			.executeTakeFirstOrThrow();

		const queryParamName = `recipient-${actionInstance.id}`;
		const query = pageContext.searchParams?.[queryParamName] as string | undefined;

		return (
			<UserSelectServer
				fieldName="recipient"
				fieldLabel="Recipient email address"
				community={community}
				query={query}
				queryParamName={queryParamName}
			/>
		);
	}
);

export default component;
