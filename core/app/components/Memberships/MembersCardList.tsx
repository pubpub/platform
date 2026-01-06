"use client"

import type { FormsId, UsersId } from "db/public"
import type { MembersListProps, TargetId } from "./types"

import { MemberRole } from "db/public"

import { compareMemberRoles } from "~/lib/authorization/rolesRanking"
import { MemberCard, type MemberCardMember } from "./MemberCard"

const dedupeMembers = (
	members: MembersListProps<TargetId>["members"],
	availableForms: { id: FormsId; name: string; isDefault: boolean }[]
): MemberCardMember[] => {
	const dedupedMembersMap = new Map<UsersId, MemberCardMember>()

	for (const { formId, ...member } of members) {
		const correspondingForm = availableForms.find((f) => f.id === formId)

		if (!dedupedMembersMap.has(member.id)) {
			const forms =
				correspondingForm && member.role === MemberRole.contributor
					? [correspondingForm.id]
					: []
			dedupedMembersMap.set(member.id, { ...member, forms })
			continue
		}

		const existing = dedupedMembersMap.get(member.id)
		if (!existing) {
			continue
		}

		if (existing.role === MemberRole.contributor && member.role === MemberRole.contributor) {
			const forms = [...existing.forms, ...(correspondingForm && formId ? [formId] : [])]
			dedupedMembersMap.set(member.id, { ...member, forms })
			continue
		}

		if (compareMemberRoles(member.role, ">", existing.role)) {
			dedupedMembersMap.set(member.id, { ...existing, role: member.role })
		}
	}

	return [...dedupedMembersMap.values()]
}

export const MembersCardList = <T extends TargetId>({
	members,
	membershipType,
	removeMember,
	targetId,
	readOnly,
	availableForms,
}: Omit<MembersListProps<T>, "setRole">) => {
	const dedupedMembers = dedupeMembers(members, availableForms)

	if (dedupedMembers.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground text-sm">No members yet</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{dedupedMembers.map((member) => (
				<MemberCard
					key={member.id}
					member={member}
					targetId={targetId}
					membershipType={membershipType}
					readOnly={readOnly}
					availableForms={availableForms}
					removeMember={removeMember}
				/>
			))}
		</div>
	)
}
