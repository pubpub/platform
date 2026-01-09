"use client"

import type { Communities, CommunityMembershipsId } from "db/public"
import type { MemberSelectUserWithMembership } from "./types"

import { memo, useEffect, useState } from "react"
import { skipToken } from "@tanstack/react-query"

import { client } from "~/lib/api"
import { useCommunity } from "../providers/CommunityProvider"
import { MemberSelectClient } from "./MemberSelectClient"

/** Hook to wrap all API calls/status for user search */
const useMemberSelectData = ({
	community,
	memberId,
	email,
}: {
	community: Communities
	memberId?: CommunityMembershipsId
	email?: string
}) => {
	// Individual member query
	const shouldQueryForIndividualUser = !!memberId && memberId !== ""
	const { data: userResult, isPending: userPending } = client.members.get.useQuery({
		queryKey: ["getMember", memberId, community.slug],
		queryData: shouldQueryForIndividualUser
			? {
					params: { communitySlug: community.slug, memberId },
				}
			: skipToken,
	})
	const user = userResult?.body

	// User suggestions query
	const shouldQueryForUsers = !!email && email !== ""
	const usersQuery = {
		limit: 1,
		communityId: community.id,
		email: email ?? "",
	}
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
	})

	const [initialized, setInitialized] = useState(false)

	// Use effect so that we do not load the component until all data is ready
	// MemberSelectClient and Autocomplete both set state based on initial data,
	// so we need to make sure our initial data is already queried for and not undefined
	useEffect(() => {
		const isLoading =
			(shouldQueryForIndividualUser ? userPending : false) ||
			(shouldQueryForUsers ? userSuggestionsPending : false)
		if (!isLoading) {
			setInitialized(true)
		}
	}, [userPending, userSuggestionsPending, shouldQueryForIndividualUser, shouldQueryForUsers])

	return {
		initialized,
		user,
		users: userSuggestionsResult?.body ?? [],
		refetchUsers: refetch,
	}
}

type Props = {
	name: string
	value?: CommunityMembershipsId
	onChange: (value: CommunityMembershipsId | undefined) => void
}

export const MemberSelectClientFetch = memo(
	function MemberSelectClientFetch({ name, value, onChange: onChangeProp }: Props) {
		const community = useCommunity()
		const [search, setSearch] = useState("")
		const { user, users, refetchUsers } = useMemberSelectData({
			community,
			memberId: value,
			email: search,
		})

		return (
			<MemberSelectClient
				community={community}
				name={name}
				member={(user as MemberSelectUserWithMembership) ?? undefined}
				users={users}
				onChangeSearch={setSearch}
				onChangeValue={onChangeProp}
				onUserAdded={refetchUsers}
			/>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.name === nextProps.name && prevProps.value === nextProps.value
	}
)
