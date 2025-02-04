"use client";

import { useEffect, useState } from "react";
import { skipToken } from "@tanstack/react-query";

import type { Communities, CommunityMembershipsId } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { MemberSelectUserWithMembership } from "./types";
import { client } from "~/lib/api";
import { MemberSelectClient } from "./MemberSelectClient";

/** Hook to wrap all API calls/status for user search */
const useMemberSelectData = ({
	community,
	memberId,
	email,
}: {
	community: Communities;
	memberId?: CommunityMembershipsId;
	email?: string;
}) => {
	const baseQuery = { limit: 1, communityId: community.id };
	const shouldQueryForIndividualUser = !!memberId && memberId !== "";
	const shouldQueryForUsers = !!email && email !== "";

	const individualUserQuery = shouldQueryForIndividualUser
		? { ...baseQuery, memberId }
		: baseQuery;
	const usersQuery = shouldQueryForUsers ? { ...baseQuery, email } : baseQuery;

	const { data: userResult, isPending: userPending } = client.users.search.useQuery({
		queryKey: ["searchUsersById", individualUserQuery, community.slug],
		queryData: shouldQueryForIndividualUser
			? {
					query: individualUserQuery,
					params: { communitySlug: community.slug },
				}
			: skipToken,
	});
	const { data: userSuggestionsResult, isPending: userSuggestionsPending } =
		client.users.search.useQuery({
			queryKey: ["searchUsersByEmail", usersQuery, community.slug],
			queryData: shouldQueryForUsers
				? {
						query: usersQuery,
						params: { communitySlug: community.slug },
					}
				: skipToken,
		});
	const user = userResult?.body?.[0];

	const [initialized, setInitialized] = useState(false);

	// Use effect so that we do not load the component until all data is ready
	// MemberSelectClient and Autocomplete both set state based on initial data,
	// so we need to make sure our initial data is already queried for and not undefined
	useEffect(() => {
		const isLoading =
			(shouldQueryForIndividualUser ? userPending : false) ||
			(shouldQueryForUsers ? userSuggestionsPending : false);
		if (!isLoading) {
			setInitialized(true);
		}
	}, [userPending, userSuggestionsPending]);

	return { initialized, user, users: userSuggestionsResult?.body ?? [] };
};

type Props = {
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	value?: CommunityMembershipsId;
	allowPubFieldSubstitution?: boolean;
	helpText?: string;
};

/**
 * The same as MemberSelectServer, but on the client, where we use our API to search
 * for users instead of direct db queries
 */
export function MemberSelectClientFetch({
	community,
	fieldLabel,
	fieldName,
	value,
	helpText,
	allowPubFieldSubstitution = true,
}: Props) {
	const [search, setSearch] = useState("");
	const { initialized, user, users } = useMemberSelectData({
		community,
		memberId: value,
		email: search,
	});

	if (!initialized) {
		return <Skeleton className="h-9 w-full" />;
	}

	return (
		<MemberSelectClient
			helpText={helpText}
			community={community}
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			member={(user as MemberSelectUserWithMembership) ?? undefined}
			users={users}
			allowPubFieldSubstitution={allowPubFieldSubstitution}
			onChange={setSearch}
		/>
	);
}
