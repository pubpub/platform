"use client"

import type { UsersId } from "db/public"
import type { MembersListProps, TargetId } from "./types"

import { Button } from "ui/button"
import { Trash } from "ui/icon"
import { toast } from "ui/use-toast"

import { didSucceed, useServerAction } from "~/lib/serverActions"

type Props<T extends TargetId> = {
	userId: UsersId
	targetId: T
	removeMember: MembersListProps<T>["removeMember"]
}

export const RemoveMemberButton = <T extends TargetId>({
	userId,
	targetId,
	removeMember,
}: Props<T>) => {
	const runRemoveMember = useServerAction(removeMember)

	const handleClick = async () => {
		const result = await runRemoveMember(userId, targetId)
		if (didSucceed(result)) {
			toast.success("Member removed")
		}
	}

	return (
		<Button
			aria-label="Remove member"
			data-testid={`remove-member-button-${userId}`}
			className="ml-auto"
			type="button"
			variant="ghost"
			onClick={handleClick}
		>
			<Trash size={14} />
		</Button>
	)
}
