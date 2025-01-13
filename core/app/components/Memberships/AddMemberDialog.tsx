"use client"

import React, { useState } from "react"

import type { MemberRole, NewUsers, UsersId } from "db/public"
import { Button } from "ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog"
import { UserPlus } from "ui/icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { MemberInviteForm } from "./MemberInviteForm"

export const AddMemberDialog = ({
	isSuperAdmin,
	existingMembers,
	addMember,
	addUserMember,
}: {
	// There's probably a better type for these functions that should be server actions
	addMember: ({ userId, role }: { userId: UsersId; role: MemberRole }) => Promise<unknown>
	addUserMember: ({
		email,
		firstName,
		lastName,
		isSuperAdmin,
		role,
	}: Omit<NewUsers, "slug"> & { role: MemberRole }) => Promise<unknown>
	isSuperAdmin: boolean
	existingMembers: UsersId[]
}) => {
	const [open, setOpen] = useState(false)
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipContent> Add a user to your community</TooltipContent>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button variant="outline" className="inline-flex items-center gap-x-2">
							<UserPlus size="16" /> Add Member
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
			</Tooltip>

			<DialogContent>
				<DialogTitle>Add Member</DialogTitle>
				<MemberInviteForm
					addMember={addMember}
					addUserMember={addUserMember}
					isSuperAdmin={isSuperAdmin}
					closeForm={() => setOpen(false)}
					existingMembers={existingMembers}
				/>
			</DialogContent>
		</Dialog>
	)
}
