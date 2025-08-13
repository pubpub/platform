import type { Metadata } from "next";

import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Button } from "ui/button";
import { tryCatch } from "utils/try-catch";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PubPageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getAuthorizedUpdateForms, userCanEditPub } from "~/lib/authorization/capabilities";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValues, NotFoundError } from "~/lib/server";
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
		const [error, pub] = await tryCatch(
			getPubsWithRelatedValues(
				{
					pubId,
					communityId,
					userId,
				},
				{
					withPubType: true,
				}
			)
		);
		if (error && !(error instanceof NotFoundError)) {
			throw error;
		}

		return pub;
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

	if (!pubId || !communitySlug) {
		return notFound();
	}

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	const formSlug = searchParams.form;

	if (!community) {
		notFound();
	}

	const [pub, availableForms] = await Promise.all([
		getPubsWithRelatedValuesCached({
			pubId: params.pubId as PubsId,
			communityId: community.id,
			userId: user.id,
		}),

		getAuthorizedUpdateForms(user.id, params.pubId).execute(),
	]);

	const canUpdatePub = availableForms.length > 0;

	if (!canUpdatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	if (!pub) {
		return notFound();
	}

	const hasAccessToCurrentForm = !availableForms.find(
		(form) => form.slug === formSlug || (form.isDefault && !formSlug)
	);
	const defaultForm = availableForms.find((form) => form.isDefault);
	if (!hasAccessToCurrentForm) {
		const redirectQuery = defaultForm ? "" : `?form=${availableForms[0].slug}`;

		// redirect to first available form
		redirect(`/c/${communitySlug}/pubs/${pub.id}/edit${redirectQuery}`);
	}

	const htmlFormId = `edit-pub-${pub.id}`;

	return (
		<ContentLayout
			left={
				<Button form={htmlFormId} type="submit">
					Save
				</Button>
			}
			title={
				<PubPageTitleWithStatus
					title="Edit pub"
					defaultFormSlug={searchParams.form}
					forms={availableForms}
				/>
			}
			right={
				<Button variant="link" asChild>
					<Link href={`/c/${communitySlug}/pubs/${pub.id}`}>View Pub</Link>
				</Button>
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose flex-1">
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
