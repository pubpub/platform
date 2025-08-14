import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { type PubTypesId } from "db/public";
import { Button } from "ui/button";
import { Label } from "ui/label";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PubPageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getAuthorizedCreateForms } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { resolveFormAccess } from "~/lib/server/form-access";
import { redirectToPubCreatePage, redirectToUnauthorized } from "~/lib/server/navigation/redirects";

export async function generateMetadata(props: {
	params: Promise<{ pubId: string; communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;

	const { communitySlug } = params;

	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	return { title: `Create pub in ${community.name}` };
}

export default async function Page(props: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<Record<string, string> & { pubTypeId: PubTypesId; form?: string }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	]);

	if (!user || !community) {
		notFound();
	}

	if (!community) {
		notFound();
	}

	const availableForms = await getAuthorizedCreateForms({
		userId: user.id,
		communityId: community.id,
		pubTypeId: searchParams.pubTypeId,
	}).execute();

	// ensure user has access to at least one form, and resolve the current form
	const {
		hasAccessToAnyForm,
		hasAccessToCurrentForm,
		canonicalForm: createFormToRedirectTo,
	} = resolveFormAccess({
		availableForms,
		requestedFormSlug: searchParams.form,
		communitySlug: community.slug,
	});

	if (!hasAccessToAnyForm) {
		await redirectToUnauthorized();
	}

	if (hasAccessToAnyForm && !hasAccessToCurrentForm) {
		await redirectToPubCreatePage({
			communitySlug: community.slug,
			formSlug: createFormToRedirectTo.slug,
		});
	}

	const htmlFormId = `create-pub`;

	return (
		<ContentLayout
			left={
				<Button form={htmlFormId} type="submit">
					Save
				</Button>
			}
			title={
				<PubPageTitleWithStatus
					title="Create pub"
					forms={availableForms}
					defaultFormSlug={searchParams.form}
				/>
			}
			right={<div />}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose flex-1">
					<PubEditor
						searchParams={searchParams}
						communityId={community.id}
						htmlFormId={htmlFormId}
						formSlug={searchParams.form}
						// PubEditor checks for the existence of the stageId prop
						{...(searchParams["stageId"] ? { stageId: searchParams["stageId"] } : {})}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
