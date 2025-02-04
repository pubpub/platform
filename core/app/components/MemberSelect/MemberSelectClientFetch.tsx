"use client";

import { useEffect, useState } from "react";
import { skipToken } from "@tanstack/react-query";

import type { Communities, CommunityMembershipsId } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { MemberSelectUserWithMembership } from "./types";
import { client } from "~/lib/api";
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

/**
 * The same as MemberSelectServer, but on the client, where we use our API to search
 * for users instead of direct db queries
 */
export function MemberSelectClientFetch({
	community,
	fieldLabel,
	fieldName,
	query,
	queryParamName,
	value,
	helpText,
	allowPubFieldSubstitution = true,
}: Props) {
	const baseQuery = { limit: 1, communityId: community.id };
	const shouldQueryForIndividualUser = !!value && value !== "";
	const shouldQueryForUsers = !!query && query !== "";

	const individualUserQuery = shouldQueryForIndividualUser
		? { ...baseQuery, memberId: value }
		: baseQuery;
	const emailQuery = shouldQueryForUsers ? { ...baseQuery, email: query } : baseQuery;

	const { data: userQuery, isPending: userPending } = client.users.search.useQuery({
		queryKey: ["searchUsersById", individualUserQuery, community.slug],
		queryData: shouldQueryForIndividualUser
			? {
					query: individualUserQuery,
					params: { communitySlug: community.slug },
				}
			: skipToken,
	});
	const { data: userSuggestionsQuery, isPending: userSuggestionsPending } =
		client.users.search.useQuery({
			queryKey: ["searchUsersByEmail", emailQuery, community.slug],
			queryData: shouldQueryForUsers
				? {
						query: { limit: 1, communityId: community.id, email: query },
						params: { communitySlug: community.slug },
					}
				: skipToken,
		});
	const user = userQuery?.body?.[0];

	const [initialized, setInitialized] = useState(false);

	// Use effect so that we do not load the component until all data is ready
	// MemberSelectClient and Autocomplete both set state based on initial data,
	// so we need to make sure our initial data is already queried for and not undefined
	useEffect(() => {
		const isLoading =
			(value ? userPending : false) ||
			(query && query !== "" ? userSuggestionsPending : false);
		if (!isLoading) {
			setInitialized(true);
		}
	}, [userPending, userSuggestionsPending]);

	if (!initialized) {
		return <Skeleton className="h-9 w-full" />;
	}

	return (
		<MemberSelectClient
			helpText={helpText}
			community={community}
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			queryParamName={queryParamName}
			member={(user as MemberSelectUserWithMembership) ?? undefined}
			users={userSuggestionsQuery?.body ?? []}
			allowPubFieldSubstitution={allowPubFieldSubstitution}
		/>
	);
}
