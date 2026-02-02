import type { Metadata } from "next"

import { notFound, redirect } from "next/navigation"

import { Capabilities, MembershipType } from "db/public"
import { Users } from "ui/icon"

import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog"
import { MembersCardList } from "~/app/components/Memberships/MembersCardList"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { getSimpleForms } from "~/lib/server/form"
import { selectAllCommunityMemberships } from "~/lib/server/member"
import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"
import { addMember, createUserWithCommunityMembership, removeCommunityMember } from "./actions"

export const metadata: Metadata = {
	title: "Members",
}

export default async function Page(props: {
	params: Promise<{
		communitySlug: string
	}>
	searchParams: Promise<{
		page?: string
		email?: string
	}>
}) {
	const searchParams = await props.searchParams
	const params = await props.params

	const { communitySlug } = params

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	])

	if (!community) {
		return notFound()
	}

	const page = parseInt(searchParams.page ?? "1", 10)
	const [members, availableForms, canEditCommunity] = await Promise.all([
		selectAllCommunityMemberships({ communityId: community.id }).execute(),
		getSimpleForms(),
		userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),
	])

	if (!canEditCommunity) {
		return redirect(`/c/${communitySlug}/unauthorized`)
	}

	if (!members.length && page !== 1) {
		return notFound()
	}

	const flatMembers = members.map((member) => ({
		...member.user,
		role: member.role,
		formId: member.formId,
	}))

	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<Users size={20} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Members
				</ContentLayoutTitle>

				<ContentLayoutActions>
					<AddMemberDialog
						addMember={addMember}
						addUserMember={createUserWithCommunityMembership}
						existingMembers={flatMembers.map((member) => member.id)}
						isSuperAdmin={user.isSuperAdmin}
						membershipType={MembershipType.community}
						availableForms={availableForms}
						className="bg-emerald-500 text-white"
					/>
				</ContentLayoutActions>
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<MembersCardList
					members={flatMembers}
					membershipType={MembershipType.community}
					removeMember={removeCommunityMember}
					targetId={community.id}
					readOnly={!canEditCommunity}
					availableForms={availableForms}
				/>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
