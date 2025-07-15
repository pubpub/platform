import type { Metadata } from "next";

import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eye } from "lucide-react";

import type { PubsId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Button } from "ui/button";
import { Pencil } from "ui/icon";
import { tryCatch } from "utils/try-catch";

import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { MembersList } from "~/app/components//Memberships/MembersList";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { FormSwitcher } from "~/app/components/FormSwitcher/FormSwitcher";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { RemovePubButton } from "~/app/components/pubs/RemovePubButton";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getAuthorizedViewForms, userCan, userCanEditPub } from "~/lib/authorization/capabilities";
import { getStageActions } from "~/lib/db/queries";
import { getPubByForm, getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValues, pubValuesByVal } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { getStages } from "~/lib/server/stages";
import {
	addPubMember,
	addUserWithPubMembership,
	removePubMember,
	setPubMemberRole,
} from "./actions";
import { PubValues } from "./components/PubValues";
import { RelatedPubsTableWrapper } from "./components/RelatedPubsTableWrapper";

export async function generateMetadata(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;

	const { pubId } = params;

	// TODO: replace this with the same function as the one which is used in the page to take advantage of request deduplication using `React.cache`

	const pub = await autoCache(
		db
			.selectFrom("pubs")
			.selectAll("pubs")
			.select(pubValuesByVal(pubId))
			.where("id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		return { title: "Pub Not Found" };
	}

	const title = Object.entries(pub.values).find(([key]) => /title/.test(key))?.[1];

	if (!title) {
		return { title: `Pub ${pub.id}` };
	}

	return { title: title as string };
}

export default async function Page(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>;
	searchParams: Promise<Record<string, string>>;
}) {
	const { form: formSlug, ...searchParams } = await props.searchParams;
	const params = await props.params;
	const { pubId, communitySlug } = params;

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!pubId || !communitySlug) {
		return notFound();
	}

	if (!community) {
		notFound();
	}

	const communityStagesPromise = getStages({
		communityId: community.id,
		userId: user.id,
	}).execute();

	// We don't pass the userId here because we want to include related pubs regardless of authorization
	// This is safe because we've already explicitly checked authorization for the root pub
	const pubPromise = tryCatch(
		getPubsWithRelatedValues(
			{ pubId: params.pubId, communityId: community.id },
			{
				withPubType: true,
				withRelatedPubs: true,
				withStage: true,
				withStageActionInstances: true,
				withMembers: true,
				depth: 3,
			}
		)
	);

	const actionsPromise = getStageActions({ pubId: pubId }).execute();

	const getFormProps = formSlug
		? { communityId: community.id, slug: formSlug }
		: {
				communityId: community.id,
				pubId: pubId,
			};
	// surely this can be done in fewer queries
	const [
		canView,
		canEdit,
		canArchive,
		canRunActions,
		canAddMember,
		canRemoveMember,
		canCreateRelatedPub,
		[pubErr, pub],

		actions,
		communityStages,
		withExtraPubValues,
		availableForms,
		form,
	] = await Promise.all([
		userCan(Capabilities.viewPub, { type: MembershipType.pub, pubId }, user.id),
		userCanEditPub({ userId: user.id, pubId }),
		userCan(Capabilities.deletePub, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.runAction, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.addPubMember, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.createRelatedPub, { type: MembershipType.pub, pubId }, user.id),
		pubPromise,
		actionsPromise,
		communityStagesPromise,
		userCan(
			Capabilities.seeExtraPubValues,
			{ type: MembershipType.pub, pubId: pubId },
			user.id
		),
		getAuthorizedViewForms(user.id, pubId).execute(),
		getForm(getFormProps).executeTakeFirst(),
	]);

	if (!canView) {
		redirect(`/c/${params.communitySlug}/unauthorized`);
	}

	if (pubErr || !pub) {
		notFound();
	}

	if (!form) {
		return null;
	}

	const pubTypeHasRelatedPubs = pub.pubType.fields.some((field) => field.isRelation);
	const pubHasRelatedPubs = pub.values.some((value) => !!value.relatedPub);

	const { stage, ...slimPub } = pub;
	const pubByForm = getPubByForm({ pub, form, withExtraPubValues });
	return (
		<div className="flex flex-col space-y-4">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<div className="flex items-baseline gap-2">
						<span className="text-lg font-semibold text-muted-foreground">
							{pub.pubType.name}
						</span>
						<FormSwitcher
							defaultFormSlug={formSlug}
							forms={availableForms}
							className="ml-4 p-1 text-xs text-muted-foreground"
						>
							<Eye size={14} />
						</FormSwitcher>
					</div>
					<h1 className="mb-2 text-xl font-bold">{getPubTitle(pub)} </h1>
				</div>
				<div className="flex items-center gap-2">
					{canEdit && (
						<Button
							variant="outline"
							size="sm"
							asChild
							className="flex items-center gap-x-2 py-4"
						>
							<Link href={`/c/${communitySlug}/pubs/${pub.id}/edit`}>
								<Pencil size="12" />
								<span>Update</span>
							</Link>
						</Button>
					)}
					{canArchive && (
						<RemovePubButton pubId={pub.id} redirectTo={`/c/${communitySlug}/pubs`} />
					)}
				</div>
			</div>

			<div className="flex flex-wrap space-x-4">
				<div className="flex-1">
					<PubValues pub={pubByForm} />
				</div>
				<div className="flex w-96 flex-col gap-4 rounded-lg bg-gray-50 p-4 shadow-inner">
					{pub.stage ? (
						<div>
							<div className="mb-1 text-lg font-bold">Current Stage</div>
							<div
								className="ml-4 flex items-center gap-2 font-medium"
								data-testid="current-stage"
							>
								<Move
									stageName={pub.stage.name}
									pubId={pub.id}
									stageId={pub.stage.id}
									communityStages={communityStages}
								/>
							</div>
						</div>
					) : null}
					<div>
						<div className="mb-1 text-lg font-bold">Actions</div>
						{actions && actions.length > 0 && stage && canRunActions ? (
							<div className="ml-4">
								<PubsRunActionDropDownMenu
									actionInstances={actions}
									pubId={pubId}
									stage={stage!}
									testId="run-action-primary"
								/>
							</div>
						) : (
							<div className="ml-4 font-medium">
								Configure actions to run for this Pub in the stage management
								settings
							</div>
						)}
					</div>

					<div className="flex flex-col gap-y-4">
						<div className="mb-2 flex justify-between">
							<span className="text-lg font-bold">Members</span>
							{canAddMember && (
								<AddMemberDialog
									addMember={addPubMember.bind(null, pubId)}
									addUserMember={addUserWithPubMembership.bind(null, pubId)}
									existingMembers={pub.members.map((member) => member.id)}
									isSuperAdmin={user.isSuperAdmin}
									membershipType={MembershipType.pub}
									availableForms={availableForms}
								/>
							)}
						</div>
						<MembersList
							members={pub.members}
							setRole={setPubMemberRole}
							removeMember={removePubMember}
							targetId={pubId}
							readOnly={!canRemoveMember}
						/>
					</div>
				</div>
			</div>
			{(pubTypeHasRelatedPubs || pubHasRelatedPubs) && (
				<div className="flex flex-col gap-2" data-testid="related-pubs">
					<h2 className="mb-2 text-xl font-bold">Related Pubs</h2>
					{canCreateRelatedPub && (
						<CreatePubButton
							text="Add Related Pub"
							communityId={community.id}
							relatedPub={{ pubId: pub.id, pubTypeId: pub.pubTypeId }}
							className="w-fit"
						/>
					)}
					<RelatedPubsTableWrapper pub={pubByForm} />
				</div>
			)}
		</div>
	);
}
