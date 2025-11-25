"use client"

import type { FormsId } from "db/public"
import type { SafeUser } from "~/lib/server/user"
import type { MembersListProps, TargetId } from "./types"

import { MemberRole } from "db/public"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"

import { compareMemberRoles } from "~/lib/authorization/rolesRanking"
import { EditMemberDialog } from "./EditMemberDialog"
import { RemoveMemberButton } from "./RemoveMemberButton"

const dedupeMembers = (
	members: (SafeUser & {
		role: MemberRole
		formId: FormsId | null
	})[],
	availableForms: {
		id: FormsId
		name: string
		isDefault: boolean
	}[]
) => {
	const dedupedMembersMap = new Map<any, any>()
	for (const { formId, ...member } of members) {
		const correspondingForm = availableForms.find((f) => f.id === formId)
		if (!dedupedMembersMap.has(member.id)) {
			const forms =
				correspondingForm && member.role === MemberRole.contributor
					? [correspondingForm.id]
					: []
			dedupedMembersMap.set(member.id, {
				...member,
				forms,
			})
			continue
		}

		const m = dedupedMembersMap.get(member.id)

		if (m && m.role === MemberRole.contributor && member.role === MemberRole.contributor) {
			const forms = [...(m.forms ?? []), ...(correspondingForm ? [formId] : [])]
			dedupedMembersMap.set(member.id, {
				...member,
				forms,
			})
			continue
		}

		if (m && compareMemberRoles(member.role, ">", m.role)) {
			dedupedMembersMap.set(member.id, m)
		}
	}
	return dedupedMembersMap
}

export const MembersList = <T extends TargetId>({
	members,
	membershipType,
	removeMember,
	targetId,
	readOnly,
	availableForms,
}: MembersListProps<T>) => {
	const finalMembers = dedupeMembers(members, availableForms)
	return (
		<>
			{[...finalMembers.values()].map((user) => (
				<div key={user.id} className="flex items-center justify-between gap-4">
					<div className="flex items-center">
						<Avatar className="mr-2 h-9 w-9">
							<AvatarImage src={user.avatar || undefined} />
							<AvatarFallback>
								{(user.firstName || user.email)[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className="text-xs">
								{user.firstName} {user.lastName}
							</div>
							<div className="text-gray-400 text-xs">{user.email}</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{readOnly ? (
							<span className="rounded-full bg-blue-500 px-3 py-2 font-medium text-gray-50 text-sm capitalize">
								{user.role}
							</span>
						) : (
							<>
								<RemoveMemberButton
									userId={user.id}
									targetId={targetId}
									removeMember={removeMember}
								/>
								<EditMemberDialog
									member={{ userId: user.id, role: user.role, forms: user.forms }}
									membershipTargetId={targetId}
									membershipType={membershipType}
									availableForms={availableForms}
									minimal
								/>
							</>
						)}
					</div>
				</div>
			))}
		</>
	)
}
