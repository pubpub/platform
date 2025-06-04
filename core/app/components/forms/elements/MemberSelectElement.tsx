"use client";

import { Value } from "@sinclair/typebox/value";
import { memberSelectConfigSchema } from "schemas";

import type { CommunityMembershipsId } from "db/public";
import { InputComponent } from "db/public";

import type { InputElementProps } from "../types";
import { MemberSelectClientFetch } from "../../MemberSelect/MemberSelectClientFetch";
import { useCommunity } from "../../providers/CommunityProvider";

export const MemberSelectElement = (
	props: InputElementProps<InputComponent.memberSelect> & {
		value: CommunityMembershipsId | undefined;
	}
) => {
	const community = useCommunity();
	if (!community) {
		return null;
	}

	if (!Value.Check(memberSelectConfigSchema, props.config)) {
		return null;
	}

	return (
		<MemberSelectClientFetch
			community={community}
			fieldLabel={props.config.label ?? ""}
			fieldName={props.slug}
			value={props.value}
			allowPubFieldSubstitution={false}
			helpText={props.config.help}
		/>
	);
};
