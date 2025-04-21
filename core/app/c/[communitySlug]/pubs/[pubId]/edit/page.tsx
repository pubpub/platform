import type { Metadata } from "next";

import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { FormSwitcher } from "~/app/components/FormSwitcher/FormSwitcher";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getAuthorizedUpdateForms, userCanEditPub } from "~/lib/authorization/capabilities";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValues } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";

const getPubsWithRelatedValuesCached = cache(
	async ({
		userId,
		pubId,
		communityId,
	}: {
		userId?: UsersId;
		pubId: PubsId;
		communityId: CommunitiesId;
	}) => {
		return getPubsWithRelatedValues(
			{
				pubId,
				communityId,
				userId,
			},
			{
				withPubType: true,
			}
		);
	}
);

export async function generateMetadata(props: {
	params: Promise<{ pubId: string; communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;

	const { pubId, communitySlug } = params;

	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	const pub = await getPubsWithRelatedValuesCached({
		pubId: pubId as PubsId,
		communityId: community.id as CommunitiesId,
	});

	if (!pub) {
		return { title: "Pub Not Found" };
	}

	const title = getPubTitle(pub);

	if (!title) {
		return { title: `Edit Pub ${pub.id}` };
	}

	return { title: title as string };
}

export default async function Page(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>;
	searchParams: Promise<Record<string, string> & { form: string }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const { pubId, communitySlug } = params;

	const { user } = await getPageLoginData();

	if (!pubId || !communitySlug) {
		return null;
	}

	const canUpdatePub = await userCanEditPub({ userId: user.id, pubId });

	if (!canUpdatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const pub = await getPubsWithRelatedValuesCached({
		pubId: params.pubId as PubsId,
		communityId: community.id,
		userId: user.id,
	});

	if (!pub) {
		return null;
	}

	const availableForms = await getAuthorizedUpdateForms(user.id, pub.id).execute();

	const htmlFormId = `edit-pub-${pub.id}`;

	return (
		<ContentLayout
			left={
				<Button form={htmlFormId} type="submit">
					Save
				</Button>
			}
			title={<PageTitleWithStatus title="Edit pub" />}
			right={
				<Button variant="link" asChild>
					<Link href={`/c/${communitySlug}/pubs/${pub.id}`}>View Pub</Link>
				</Button>
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose flex-1">
					<FormSwitcher defaultFormSlug={searchParams.form} forms={availableForms} />
					{/** TODO: Add suspense */}
					<PubEditor
						searchParams={searchParams}
						formSlug={searchParams.form}
						pubId={pub.id}
						htmlFormId={htmlFormId}
						communityId={community.id}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
