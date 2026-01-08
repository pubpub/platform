import type { User } from "lucia"

import { Users } from "lucide-react"

import { Capabilities, MembershipType, type StagesId } from "db/public"
import { Card, CardAction, CardContent, CardTitle } from "ui/card"

import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog"
import { MembersCardList } from "~/app/components/Memberships/MembersCardList"
import { userCan } from "~/lib/authorization/capabilities"
import { getStageMembers } from "~/lib/db/queries"
import { getSimpleForms } from "~/lib/server/form"
import { addStageMember, addUserWithStageMembership, removeStageMember } from "../../actions"
import { StagePanelCardHeader } from "../editor/StagePanelCard"

type Props = {
	stageId: StagesId
	user: User
}

export const StagePanelMembers = async ({ stageId, user }: Props) => {
	const [members, canManage, availableForms] = await Promise.all([
		getStageMembers(stageId).execute(),
		userCan(Capabilities.removeStageMember, { type: MembershipType.stage, stageId }, user.id),
		getSimpleForms(),
	])

	return (
		<Card className="h-full">
			<StagePanelCardHeader>
				<div className="flex items-center gap-2">
					<Users size={16} />
					<CardTitle>Members</CardTitle>
				</div>
				<CardAction>
					<AddMemberDialog
						className="!bg-transparent m-0 h-6 border-none p-0 text-muted-foreground text-xs shadow-none hover:bg-transparent hover:text-foreground"
						addMember={addStageMember.bind(null, stageId)}
						addUserMember={addUserWithStageMembership.bind(null, stageId)}
						existingMembers={members.map((member) => member.id)}
						isSuperAdmin={user.isSuperAdmin}
						membershipType={MembershipType.stage}
						availableForms={availableForms}
					/>
				</CardAction>
			</StagePanelCardHeader>
			<CardContent>
				<MembersCardList
					members={members}
					membershipType={MembershipType.stage}
					removeMember={removeStageMember}
					targetId={stageId}
					readOnly={!canManage}
					availableForms={availableForms}
				/>
			</CardContent>
		</Card>
	)
}
