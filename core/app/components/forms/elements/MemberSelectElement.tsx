"use server";

import { Value } from "@sinclair/typebox/value";
import { memberSelectConfigSchema } from "schemas";

import type { CommunityMembershipsId, MembersId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { MemberSelectServer } from "../../MemberSelect/MemberSelectServer";

export const MemberSelectElement = async ({
	name,
	id,
	value,
	searchParams,
	communitySlug,
	config,
}: {
	name: string;
	id: string;
	value?: CommunityMembershipsId;
	searchParams: Record<string, unknown>;
	communitySlug: string;
	config: any;
}) => {
	const community = await autoCache(
		db.selectFrom("communities").selectAll().where("slug", "=", communitySlug)
	).executeTakeFirstOrThrow();
	const queryParamName = `user-${id.split("-").pop()}`;
	const query = searchParams?.[queryParamName] as string | undefined;

	if (!Value.Check(memberSelectConfigSchema, config)) {
		return null;
	}

	return (
		<MemberSelectServer
			community={community}
			fieldLabel={config.label ?? name}
			fieldName={name}
			query={query}
			queryParamName={queryParamName}
			value={value}
			allowPubFieldSubstitution={false}
			helpText={config.help}
		/>
	);
};
