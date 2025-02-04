import type { CommunityMembershipsId } from "db/public";

import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { MemberSelectClientFetch } from "~/app/components/MemberSelect/MemberSelectClientFetch";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ pageContext, actionInstance, communityId }) => {
		const community = await autoCache(
			db.selectFrom("communities").selectAll().where("id", "=", communityId)
		).executeTakeFirstOrThrow();

		return (
			<MemberSelectClientFetch
				fieldName="recipient"
				fieldLabel="Recipient email address"
				community={community}
				value={actionInstance.config?.recipient as CommunityMembershipsId | undefined}
			/>
		);
	}
);

export default component;
