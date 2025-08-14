import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import type { FormsId } from "db/public";
import { Capabilities, MemberRole, MembershipType } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { compareMemberRoles } from "~/lib/authorization/rolesRanking";
import { findCommunityBySlug } from "~/lib/server/community";
import { getSimpleForms } from "~/lib/server/form";
import { selectAllCommunityMemberships } from "~/lib/server/member";
import { addMember, createUserWithCommunityMembership } from "./actions";
import { MemberTable } from "./MemberTable";

export const metadata: Metadata = {
	title: "Members",
};

export default async function Page(props: {
	params: Promise<{
		communitySlug: string;
	}>;
	searchParams: Promise<{
		page?: string;
		email?: string;
	}>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const { communitySlug } = params;

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
	const [members, availableForms] = await Promise.all([
		selectAllCommunityMemberships({ communityId: community.id }).execute(),

		getSimpleForms(),
	]);

	if (!members.length && page !== 1) {
		return notFound();
	}

	const tableMembers = members.map((member) => {
		const { id, createdAt, user, role } = member;
		return {
			id: user.id,
			avatar: user.avatar,
			firstName: user.firstName,
			lastName: user.lastName,
			role,
			email: user.email,
			joined: new Date(createdAt).toLocaleString(),
			form: member.formId,
		} satisfies TableMember & { form: FormsId | null };
	});

	const dedupedMembersMap = new Map<TableMember["id"], TableMember>();
	for (const { form, ...member } of tableMembers) {
		const correspondingForm = availableForms.find((f) => f.id === form);
		if (!dedupedMembersMap.has(member.id)) {
			const forms =
				correspondingForm && member.role === MemberRole.contributor
					? [
							{
								id: correspondingForm.id,
								name: correspondingForm.name,
								slug: correspondingForm.slug,
							},
						]
					: [];
			dedupedMembersMap.set(member.id, {
				...member,
				forms,
			});
			continue;
		}

		const m = dedupedMembersMap.get(member.id);

		if (m && m.role === MemberRole.contributor && member.role === MemberRole.contributor) {
			const forms = [
				...(m.forms ?? []),
				...(correspondingForm
					? [
							{
								id: correspondingForm.id,
								name: correspondingForm.name,
								slug: correspondingForm.slug,
							},
						]
					: []),
			];
			dedupedMembersMap.set(member.id, {
				...member,
				forms,
			});
			continue;
		}

		if (m && compareMemberRoles(member.role, ">", m.role)) {
			dedupedMembersMap.set(member.id, m);
		}
	}
	const dedupedMembers = [...dedupedMembersMap.values()];

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Members</h1>
				<AddMemberDialog
					addMember={addMember}
					addUserMember={createUserWithCommunityMembership}
					existingMembers={dedupedMembers.map((member) => member.id)}
					isSuperAdmin={user.isSuperAdmin}
					membershipType={MembershipType.community}
					availableForms={availableForms}
				/>
			</div>
			<MemberTable members={dedupedMembers} />
		</>
	);
}
