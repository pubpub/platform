import type { User } from "lucia"

import { Users } from "lucide-react"

import { Capabilities, MembershipType, type StagesId } from "db/public"
import { Card, CardAction, CardContent, CardTitle } from "ui/card"

import { MembersList } from "~/app/components//Memberships/MembersList"
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog"
import { userCan } from "~/lib/authorization/capabilities"
import { getStageMembers } from "~/lib/db/queries"
import { getSimpleForms } from "~/lib/server/form"
import {
	addStageMember,
	addUserWithStageMembership,
	removeStageMember,
	setStageMemberRole,
} from "../../actions"
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
						className="m-0 h-6 border-none bg-transparent p-0 text-neutral-600 text-xs shadow-none hover:bg-transparent hover:text-neutral-900"
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
				<MembersList
					members={members}
					membershipType={MembershipType.stage}
					setRole={setStageMemberRole}
					removeMember={removeStageMember}
					targetId={stageId}
					readOnly={!canManage}
					availableForms={availableForms}
				/>
			</CardContent>
		</Card>
	)
}
