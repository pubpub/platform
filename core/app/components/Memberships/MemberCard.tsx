"use client"

import type { FormsId, MemberRole, MembershipType, UsersId } from "db/public"
import type { SafeUser } from "~/lib/server/user"
import type { TargetId } from "./types"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Badge } from "ui/badge"
import { cn } from "utils"

import { EditMemberDialog } from "./EditMemberDialog"
import { RemoveMemberButton } from "./RemoveMemberButton"

export type MemberCardMember = SafeUser & {
	role: MemberRole
	forms: FormsId[]
}

type MemberCardProps<T extends TargetId> = {
	member: MemberCardMember
	targetId: T
	membershipType: MembershipType
	readOnly: boolean
	availableForms: { id: FormsId; name: string; isDefault: boolean }[]
	removeMember: (userId: UsersId, targetId: T) => Promise<unknown>
	className?: string
}

const getRoleBadgeVariant = (role: MemberRole) => {
	switch (role) {
		case "admin":
			return "default"
		case "editor":
			return "secondary"
		case "contributor":
			return "outline"
		default:
			return "secondary"
	}
}

export const MemberCard = <T extends TargetId>({
	member,
	targetId,
	membershipType,
	readOnly,
	availableForms,
	removeMember,
	className,
}: MemberCardProps<T>) => {
	const initials =
		`${(member.firstName || member.email)[0]}${member.lastName?.[0] ?? ""}`.toUpperCase()

	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 rounded-md border bg-card p-3",
				className
			)}
		>
			<div className="flex min-w-0 items-center gap-3">
				<Avatar className="h-9 w-9 shrink-0">
					<AvatarImage src={member.avatar || undefined} alt={member.firstName} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<div className="truncate font-medium text-sm">
						{member.firstName} {member.lastName}
					</div>
					<div className="truncate text-muted-foreground text-xs">{member.email}</div>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
					{member.role}
				</Badge>
				{!readOnly && (
					<>
						<RemoveMemberButton
							userId={member.id}
							targetId={targetId}
							removeMember={removeMember}
						/>
						<EditMemberDialog
							member={{
								userId: member.id,
								role: member.role,
								forms: member.forms,
							}}
							membershipTargetId={targetId}
							membershipType={membershipType}
							availableForms={availableForms}
							minimal
						/>
					</>
				)}
			</div>
		</div>
	)
}
