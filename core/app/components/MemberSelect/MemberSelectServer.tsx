import type { Communities, CommunityMembershipsId } from "db/public";

import type { MemberSelectUser, MemberSelectUserWithMembership } from "./types";
import { selectCommunityMember } from "~/lib/server/member";
import { getSuggestedUsers } from "~/lib/server/user";
import { MemberSelectClient } from "./MemberSelectClient";

type Props = {
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	query?: string;
	/**
	 * unique name of the query parameter that holds the to-be-looked-up user's email address
	 *
	 * Necessary, because otherwise having multiple instances of the same component on the same page
	 * would result in the same query parameter being used for all instances.
	 */
	queryParamName: string;
	value?: CommunityMembershipsId;
	allowPubFieldSubstitution?: boolean;
	helpText?: string;
};

export async function MemberSelectServer({
	community,
	fieldLabel,
	fieldName,
	query,
	queryParamName,
	value,
	helpText,
	allowPubFieldSubstitution = true,
}: Props) {
	let member: MemberSelectUserWithMembership | undefined | null;

	if (value !== undefined) {
		const inbetweenMember = await selectCommunityMember({
			id: value,
		}).executeTakeFirst();

		if (inbetweenMember) {
			member = {
				...inbetweenMember.user,
				member: inbetweenMember,
			};
		}
	}

	if (!Boolean(query) && member === undefined) {
		return (
			<MemberSelectClient
				helpText={helpText}
				community={community}
				fieldLabel={fieldLabel}
				fieldName={fieldName}
				queryParamName={queryParamName}
				users={[]}
				allowPubFieldSubstitution={allowPubFieldSubstitution}
			/>
		);
	}

	const users: MemberSelectUser[] = await getSuggestedUsers({
		communityId: community.id,
		query: { email: query ?? "" },
	}).execute();

	return (
		<MemberSelectClient
			helpText={helpText}
			community={community}
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			queryParamName={queryParamName}
			member={member ?? undefined}
			users={users}
			allowPubFieldSubstitution={allowPubFieldSubstitution}
		/>
	);
}
