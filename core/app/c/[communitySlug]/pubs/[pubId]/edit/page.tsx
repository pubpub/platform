import type { Metadata } from "next";

import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Button } from "ui/button";
import { tryCatch } from "utils/try-catch";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PubPageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getAuthorizedUpdateForms, getAuthorizedViewForms } from "~/lib/authorization/capabilities";
import { constructRedirectToPubDetailPage } from "~/lib/links";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValues, NotFoundError } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { resolveFormAccess } from "~/lib/server/form-access";
import { redirectToPubEditPage, redirectToUnauthorized } from "~/lib/server/navigation/redirects";

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
					withStage: true,
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

	if (!community) {
		notFound();
	}

	const [pub, availableUpdateForms, availableViewForms] = await Promise.all([
		getPubsWithRelatedValuesCached({
			pubId: params.pubId as PubsId,
			communityId: community.id,
			userId: user.id,
		}),

		getAuthorizedUpdateForms(user.id, params.pubId).execute(),
		getAuthorizedViewForms(user.id, params.pubId).execute(),
	]);

	if (!pub) {
		return notFound();
	}

	// ensure user has access to at least one form, and resolve the current form
	// const {
	// 	hasAccessToAnyForm: hasAccessToAnyUpdateForm,
	// 	hasAccessToCurrentForm: hasAccessToCurrentUpdateForm,
	// 	canonicalForm: updateFormToRedirectTo,
	const {
		hasAccessToAnyForm: hasAccessToAnyUpdateForm,
		hasAccessToCurrentForm: hasAccessToCurrentUpdateForm,
		canonicalForm: updateFormToRedirectTo,
	} = resolveFormAccess({
		availableForms: availableUpdateForms,
		requestedFormSlug: searchParams.form,
		communitySlug,
	});

	if (!hasAccessToAnyUpdateForm) {
		return await redirectToUnauthorized();
	}

	if (!hasAccessToCurrentUpdateForm) {
		return await redirectToPubEditPage({
			pubId,
			communitySlug,
			formSlug: updateFormToRedirectTo.slug,
		});
	}

	const { hasAccessToAnyForm: hasAccessToAnyViewForm, canonicalForm: viewFormToRedirectTo } =
		resolveFormAccess({
			availableForms: availableViewForms,
			requestedFormSlug: searchParams.form,
			communitySlug,
		});

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
					forms={availableUpdateForms}
				/>
			}
			right={
				hasAccessToAnyViewForm && (
					<Button variant="link" asChild>
						<Link
							href={constructRedirectToPubDetailPage({
								pubId,
								communitySlug,
								formSlug: viewFormToRedirectTo.slug,
							})}
						>
							View Pub
						</Link>
					</Button>
				)
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose flex-1">
					{/** TODO: Add suspense */}
					<PubEditor
						mode="edit"
						pubId={pub.id}
						pub={pub}
						htmlFormId={htmlFormId}
						pubTypeId={pub.pubTypeId}
						form={updateFormToRedirectTo}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
