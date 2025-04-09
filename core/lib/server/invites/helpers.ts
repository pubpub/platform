import type { ExpressionBuilder } from "kysely";

import { sql } from "kysely";

import type { FormsId } from "db/public";
import { InviteFormType } from "db/public";

export const withInvitedFormIds = <EB extends ExpressionBuilder<any, any>>(
	eb: EB,
	ref: `${string}.${string}`
) => [
	sql<FormsId[]>`(select coalesce(json_agg("formId"), '[]') from ${eb
		.selectFrom("invite_forms")
		.where("inviteId", "=", eb.ref(ref))
		.where("invite_forms.type", "=", InviteFormType.communityLevel)
		.select("formId")
		.as("communityFormIds")})`.as("communityLevelFormIds"),
	sql<FormsId[]>`(select coalesce(json_agg("formId"), '[]') from ${eb
		.selectFrom("invite_forms")
		.where("inviteId", "=", eb.ref(ref))
		.where("invite_forms.type", "=", InviteFormType.pubOrStage)
		.select("formId")
		.as("formIds")})`.as("pubOrStageFormIds"),
];
