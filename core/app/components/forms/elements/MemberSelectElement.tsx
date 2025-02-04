"use server";

import { Value } from "@sinclair/typebox/value";
import { memberSelectConfigSchema } from "schemas";

import type { CommunityMembershipsId } from "db/public";
import { InputComponent } from "db/public";

import type { ElementProps } from "../types";
import { findCommunityBySlug } from "~/lib/server/community";
import { MemberSelectClientFetch } from "../../MemberSelect/MemberSelectClientFetch";
import { MemberSelectServer } from "../../MemberSelect/MemberSelectServer";

export const MemberSelectElement = async ({
	slug,
	label,
	id = crypto.randomUUID(),
	value,
	searchParams,
	communitySlug,
	config,
}: {
	id?: string;
	value?: CommunityMembershipsId;
	searchParams: Record<string, unknown>;
	communitySlug: string;
} & ElementProps<InputComponent.memberSelect>) => {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return null;
	}
	const queryParamName = `user-${id.split("-").pop()}`;
	const query = searchParams?.[queryParamName] as string | undefined;

	if (!Value.Check(memberSelectConfigSchema, config)) {
		return null;
	}

	return (
		<MemberSelectClientFetch
			community={community}
			fieldLabel={label}
			fieldName={slug}
			query={query}
			queryParamName={queryParamName}
			value={value}
			allowPubFieldSubstitution={false}
			helpText={config.help}
		/>
		// <MemberSelectServer
		// 	community={community}
		// 	fieldLabel={label}
		// 	fieldName={slug}
		// 	query={query}
		// 	queryParamName={queryParamName}
		// 	value={value}
		// 	allowPubFieldSubstitution={false}
		// 	helpText={config.help}
		// />
	);
};
