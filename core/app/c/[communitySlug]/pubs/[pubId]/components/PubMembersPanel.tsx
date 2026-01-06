"use client"

import type { FormsId, MemberRole, PubsId, UsersId } from "db/public"
import type { User } from "lucia"
import type { SafeUser } from "~/lib/server/user"

import { useState } from "react"
import { Users } from "lucide-react"

import { MembershipType } from "db/public"
import { Button } from "ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "ui/sheet"

import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog"
import { MembersCardList } from "~/app/components/Memberships/MembersCardList"

type PubMember = SafeUser & {
	role: MemberRole
	formId: FormsId | null
}

type Props = {
	pubId: PubsId
	members: PubMember[]
	user: User
	availableForms: { id: FormsId; name: string; isDefault: boolean }[]
	canAddMember: boolean
	canRemoveMember: boolean
	addMember: (data: { userId: UsersId; role: MemberRole; forms: FormsId[] }) => Promise<unknown>
	addUserMember: (data: {
		firstName: string
		lastName?: string | null
		email: string
		role: MemberRole
		isSuperAdmin?: boolean
		forms: FormsId[]
	}) => Promise<unknown>
	removeMember: (userId: UsersId, pubId: PubsId) => Promise<unknown>
}

export const PubMembersPanel = ({
	pubId,
	members,
	user,
	availableForms,
	canAddMember,
	canRemoveMember,
	addMember,
	addUserMember,
	removeMember,
}: Props) => {
	const [open, setOpen] = useState(false)

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="flex h-5! items-center gap-2 text-muted-foreground"
				>
					<Users size={12} className="size-4" />
					<span>{members.length}</span>
					<span className="hidden md:inline">Members</span>
				</Button>
			</SheetTrigger>
			<SheetContent className="flex w-full flex-col p-4 sm:max-w-md">
				<SheetHeader className="flex flex-row items-center justify-between">
					<SheetTitle className="flex items-center gap-2">
						<Users size={16} />
						Members
					</SheetTitle>
				</SheetHeader>
				<div className="flex items-center justify-between border-b p-4">
					<span className="text-muted-foreground text-sm">
						{members.length} member{members.length !== 1 ? "s" : ""}
					</span>
					{canAddMember && (
						<AddMemberDialog
							addMember={addMember}
							addUserMember={addUserMember}
							existingMembers={members.map((m) => m.id)}
							isSuperAdmin={user.isSuperAdmin}
							membershipType={MembershipType.pub}
							availableForms={availableForms}
							className="h-8"
						/>
					)}
				</div>
				<div className="flex-1 overflow-y-auto py-4">
					<MembersCardList
						members={members}
						membershipType={MembershipType.pub}
						removeMember={removeMember}
						targetId={pubId}
						readOnly={!canRemoveMember}
						availableForms={availableForms}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}
