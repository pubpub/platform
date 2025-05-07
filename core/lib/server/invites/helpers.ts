import type { ExpressionBuilder } from "kysely";

import { sql } from "kysely";

import type { FormsId } from "db/public";
import { MembershipType } from "db/public";

export const withInvitedFormIds = <EB extends ExpressionBuilder<any, any>>(
	eb: EB,
	ref: `${string}.${string}`
) => [
	sql<FormsId[]>`(select coalesce(json_agg("formId"), '[]') from ${eb
		.selectFrom("invite_forms")
		.where("inviteId", "=", eb.ref(ref))
		.where("invite_forms.type", "=", MembershipType.community)
		.select("formId")
		.as("communityFormIds")})`.as("communityFormIds"),
	sql<FormsId[]>`(select coalesce(json_agg("formId"), '[]') from ${eb
		.selectFrom("invite_forms")
		.where("inviteId", "=", eb.ref(ref))
		.where("invite_forms.type", "=", MembershipType.pub)
		.select("formId")
		.as("pubFormIds")})`.as("pubFormIds"),
	sql<FormsId[]>`(select coalesce(json_agg("formId"), '[]') from ${eb
		.selectFrom("invite_forms")
		.where("inviteId", "=", eb.ref(ref))
		.where("invite_forms.type", "=", MembershipType.stage)
		.select("formId")
		.as("stageFormIds")})`.as("stageFormIds"),
];
