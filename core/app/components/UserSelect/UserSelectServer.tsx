import type { Communities, MembersId } from "db/public";

import type { MemberSelectUser, MemberSelectUserWithMembership } from "./types";
import { getMember } from "~/lib/server/member";
import { getSuggestedUsers } from "~/lib/server/user";
import { UserSelectClient } from "./UserSelectClient";

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
	value?: MembersId;
	allowPubFieldSubstitution?: boolean;
};

export async function UserSelectServer({
	community,
	fieldLabel,
	fieldName,
	query,
	queryParamName,
	value,
	allowPubFieldSubstitution = true,
}: Props) {
	let member: MemberSelectUserWithMembership | undefined | null;

	if (value !== undefined) {
		const inbetweenMember = await getMember({
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
			<UserSelectClient
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
		<UserSelectClient
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
