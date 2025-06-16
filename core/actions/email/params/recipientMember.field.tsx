import type { CommunityMembershipsId } from "db/public";

import { defineActionFormFieldServerComponent } from "~/actions/_lib/custom-form-field/defineConfigServerComponent";
import { MemberSelectClientFetch } from "~/app/components/MemberSelect/MemberSelectClientFetch";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { action } from "../action";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ communityId, actionInstance }) => {
		const community = await autoCache(
			db.selectFrom("communities").selectAll().where("id", "=", communityId)
		).executeTakeFirstOrThrow();

		return (
			<MemberSelectClientFetch
				fieldName="recipientMember"
				fieldLabel="Recipient member"
				community={community}
				value={actionInstance.config?.recipientMember as CommunityMembershipsId | undefined}
			/>
		);
	}
);

export default component;
