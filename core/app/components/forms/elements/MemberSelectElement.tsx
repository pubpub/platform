"use client";

import { Value } from "@sinclair/typebox/value";
import { memberSelectConfigSchema } from "schemas";

import type { CommunityMembershipsId } from "db/public";
import { InputComponent } from "db/public";

import type { ElementProps } from "../types";
import { MemberSelectClientFetch } from "../../MemberSelect/MemberSelectClientFetch";
import { useCommunity } from "../../providers/CommunityProvider";

export const MemberSelectElement = ({
	slug,
	label,
	value,
	config,
}: {
	value?: CommunityMembershipsId;
} & ElementProps<InputComponent.memberSelect>) => {
	const community = useCommunity();
	if (!community) {
		return null;
	}

	if (!Value.Check(memberSelectConfigSchema, config)) {
		return null;
	}

	return (
		<MemberSelectClientFetch
			fieldLabel={label}
			fieldName={slug}
			value={value}
			allowPubFieldSubstitution={false}
			helpText={config.help}
		/>
	);
};
