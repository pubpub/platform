import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { TableMember } from "./getMemberTableColumns";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { selectCommunityMembers } from "~/lib/server/member";
import { addMember, createUserWithCommunityMembership } from "./actions";
import { MemberTable } from "./MemberTable";

export const metadata: Metadata = {
	title: "Members",
};

export default async function Page(
    props: {
        params: Promise<{
            communitySlug: string;
        }>;
        searchParams: Promise<{
            page?: string;
            email?: string;
        }>;
    }
) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const {
        communitySlug
    } = params;

    const community = await findCommunityBySlug(communitySlug);

    if (!community) {
		return notFound();
	}

    const { user } = await getPageLoginData();

    if (
		!(await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		))
	) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

    const page = parseInt(searchParams.page ?? "1", 10);
    const members = await selectCommunityMembers({ communityId: community.id }).execute();

    if (!members.length && page !== 1) {
		return notFound();
	}

    const tableMembers = members.map((member) => {
		const { id, createdAt, user, role } = member;
		return {
			id,
			avatar: user.avatar,
			firstName: user.firstName,
			lastName: user.lastName,
			role,
			email: user.email,
			joined: new Date(createdAt).toLocaleString(),
		} satisfies TableMember;
	});

    return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Members</h1>
				<AddMemberDialog
					addMember={addMember}
					addUserMember={createUserWithCommunityMembership}
					existingMembers={members.map((member) => member.user.id)}
					isSuperAdmin={user.isSuperAdmin}
				/>
			</div>
			<MemberTable members={tableMembers} />
		</>
	);
}
