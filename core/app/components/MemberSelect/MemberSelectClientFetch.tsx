"use client";

import { useEffect, useState } from "react";
import { isEnabled } from "@sentry/nextjs";
import { skipToken } from "@tanstack/react-query";

import type { Communities, CommunityMembershipsId } from "db/public";
import { FormItem, FormLabel } from "ui/form";
import { PubFieldSelectorToggleButton } from "ui/pubFields";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

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
	// Individual member query
	const shouldQueryForIndividualUser = !!memberId && memberId !== "";
	const { data: userResult, isPending: userPending } = client.members.get.useQuery({
		queryKey: ["getMember", memberId, community.slug],
		queryData: shouldQueryForIndividualUser
			? {
					params: { communitySlug: community.slug, memberId },
				}
			: skipToken,
	});
	const user = userResult?.body;

	// User suggestions query
	const shouldQueryForUsers = !!email && email !== "";
	const usersQuery = { limit: 1, communityId: community.id, email: email ?? "" };
	const {
		data: userSuggestionsResult,
		isPending: userSuggestionsPending,
		refetch,
	} = client.users.search.useQuery({
		queryKey: ["searchUsersByEmail", usersQuery, community.slug],
		queryData: shouldQueryForUsers
			? {
					query: usersQuery,
					params: { communitySlug: community.slug },
				}
			: skipToken,
	});

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

	return { initialized, user, users: userSuggestionsResult?.body ?? [], refetchUsers: refetch };
};

type Props = {
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	value?: CommunityMembershipsId;
	allowPubFieldSubstitution?: boolean;
	helpText?: string;
};

export function MemberSelectClientFetch({
	community,
	fieldLabel,
	fieldName,
	value,
	helpText,
	allowPubFieldSubstitution = true,
}: Props) {
	const [search, setSearch] = useState("");
	const { initialized, user, users, refetchUsers } = useMemberSelectData({
		community,
		memberId: value,
		email: search,
	});

	if (!initialized) {
		return (
			<FormItem className="flex flex-col gap-y-1">
				<div className="flex items-center justify-between">
					<FormLabel
						className={cn(
							"text-sm font-medium leading-none",
							!isEnabled && "cursor-not-allowed opacity-50"
						)}
					>
						{fieldLabel}
					</FormLabel>
					{allowPubFieldSubstitution && <PubFieldSelectorToggleButton />}
				</div>
				<Skeleton className="h-[46.5px] w-full" />
			</FormItem>
		);
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
			onUserAdded={refetchUsers}
		/>
	);
}
