"use client"

import type { UsersId } from "db/public"
import { Button } from "ui/button"
import { Trash } from "ui/icon"
import { toast } from "ui/use-toast"

import type { MembersListProps, TargetId } from "./types"
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
			toast({ title: "Success", description: "Member removed" })
		}
	}

	return (
		<Button className="ml-auto" type="button" variant="ghost" onClick={handleClick}>
			<Trash size={14} />
		</Button>
	)
}
