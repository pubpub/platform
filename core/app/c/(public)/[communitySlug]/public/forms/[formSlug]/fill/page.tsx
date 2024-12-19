import { randomUUID } from "crypto";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import type { Communities, PubsId } from "db/public";
import { ElementType, MemberRole } from "db/public";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { ContextEditorContextProvider } from "~/app/components/ContextEditor/ContextEditorContext";
import { FormElement } from "~/app/components/forms/FormElement";
import { FormElementToggleProvider } from "~/app/components/forms/FormElementToggleContext";
import {
	hydrateMarkdownElements,
	renderElementMarkdownContent,
} from "~/app/components/forms/structural";
import { SUBMIT_ID_QUERY_PARAM } from "~/app/components/pubs/PubEditor/constants";
import { SaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus";
import { getLoginData } from "~/lib/authentication/loginData";
import { getCommunityRole } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm, userHasPermissionToForm } from "~/lib/server/form";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server/pub";
import { getPubTypesForCommunity } from "~/lib/server/pubtype";
import { capitalize } from "~/lib/string";
import { ExternalFormWrapper } from "./ExternalFormWrapper";
import { RequestLink } from "./RequestLink";
import { handleFormToken } from "./utils";

const NotFound = ({ children }: { children: ReactNode }) => {
	return <div className="w-full pt-8 text-center">{children}</div>;
};

const Completed = ({ element }: { element: Form["elements"][number] | undefined }) => {
	return (
		<div data-testid="completed" className="flex w-full flex-col gap-2 pt-32 text-center">
			{element ? (
				<div
					className="prose self-center text-center"
					// Sanitize content
					dangerouslySetInnerHTML={{ __html: element.content ?? " " }}
				/>
			) : (
				<h2 className="text-lg font-semibold">Form Successfully Submitted</h2>
			)}
		</div>
	);
};

export type FormFillPageParams = { formSlug: string; communitySlug: string };

export type FormFillPageSearchParams = {
	pubId?: PubsId;
	submitId?: string;
	saveStatus?: string;
} & ({ token: string; reason: string } | { token?: never; reason?: never });

const ExpiredTokenPage = ({
	params,
	searchParams,
	form,
	community,
}: {
	params: FormFillPageParams;
	searchParams: FormFillPageSearchParams & { token: string };
	community: Communities;
	form: Form;
}) => {
	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="text-xl font-bold">
						{capitalize(form.name)} for {community?.name}
					</h1>
					<SaveStatus />
				</div>
			</Header>
			<div className="mx-auto mt-32 flex max-w-md flex-col items-center justify-center text-center">
				<h2 className="mb-2 text-lg font-semibold">Link Expired</h2>
				<p className="mb-6 text-sm">
					The link for this form has expired. Request a new one via email below to pick up
					right where you left off.
				</p>
				<RequestLink
					formSlug={params.formSlug}
					token={searchParams.token}
					// TODO: handle undefined pubId
					pubId={searchParams.pubId!}
				/>
			</div>
		</div>
	);
};

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: FormFillPageParams;
	searchParams: FormFillPageSearchParams;
}): Promise<Metadata> {
	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return { title: "Community Not Found" };
	}

	const form = await getForm({
		slug: params.formSlug,
		communityId: community.id,
	}).executeTakeFirst();

	if (!form) {
		return { title: "Form Not Found" };
	}

	return {
		title: form.name,
	};
}

export default async function FormPage({
	params,
	searchParams,
}: {
	params: FormFillPageParams;
	searchParams: FormFillPageSearchParams;
}) {
	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return notFound();
	}
	const { user, session } = await getLoginData();

	const [form, pub, pubs, pubTypes] = await Promise.all([
		getForm({
			slug: params.formSlug,
			communityId: community.id,
		}).executeTakeFirst(),
		searchParams.pubId
			? await getPubsWithRelatedValuesAndChildren(
					{ pubId: searchParams.pubId, communityId: community.id, userId: user?.id },
					{ withStage: true, withLegacyAssignee: true, withPubType: true }
				)
			: undefined,
		getPubsWithRelatedValuesAndChildren(
			{ communityId: community.id, userId: user?.id },
			{
				limit: 30,
				withStage: true,
				withLegacyAssignee: true,
				withPubType: true,
			}
		),
		getPubTypesForCommunity(community.id),
	]);

	if (!form) {
		return <NotFound>No form found</NotFound>;
	}

	if (!user && !session) {
		const result = await handleFormToken({
			params,
			searchParams,
			onExpired: ({ params, searchParams, result }) => {
				return;
			},
		});

		return (
			<ExpiredTokenPage
				params={params}
				searchParams={searchParams as FormFillPageSearchParams & { token: string }}
				form={form}
				community={community}
			/>
		);
	}

	const role = getCommunityRole(user, { slug: params.communitySlug });
	if (!role) {
		// TODO: show no access page
		return notFound();
	}

	// all other roles always have access to the form
	if (role === MemberRole.contributor) {
		const memberHasAccessToForm = await userHasPermissionToForm({
			formSlug: params.formSlug,
			userId: user.id,
			pubId: pub?.id,
		});

		if (!memberHasAccessToForm) {
			// TODO: show no access page
			return notFound();
		}
	}

	const parentPub = pub?.parentId
		? await getPubsWithRelatedValuesAndChildren(
				{ pubId: pub.parentId, communityId: community.id, userId: user?.id },
				{ withStage: true, withLegacyAssignee: true, withPubType: true }
			)
		: undefined;

	const member = expect(user.memberships.find((m) => m.communityId === community?.id));

	const memberWithUser = {
		...member,
		id: member.id,
		user: {
			...user,
			id: user.id,
		},
	};

	const submitId: string | undefined = searchParams[SUBMIT_ID_QUERY_PARAM];
	const submitElement = form.elements.find(
		(e) => e.type === ElementType.button && e.id === submitId
	);

	const renderWithPubContext = {
		communityId: community.id,
		recipient: memberWithUser,
		communitySlug: params.communitySlug,
		pub,
		parentPub,
	};

	if (submitId && submitElement) {
		// The post-submission page will only render once we have a pub
		if (pub) {
			submitElement.content = await renderElementMarkdownContent(
				submitElement,
				renderWithPubContext as RenderWithPubContext
			);
		}
	} else {
		await hydrateMarkdownElements({
			elements: form.elements,
			renderWithPubContext: pub ? (renderWithPubContext as RenderWithPubContext) : undefined,
		});
	}

	const isUpdating = !!pub;
	const pubId = pub?.id ?? (randomUUID() as PubsId);
	const pubForForm = pub ?? { id: pubId, values: [], pubTypeId: form.pubTypeId };

	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="text-xl font-bold">
						{capitalize(form.name)} for {community?.name}
					</h1>
					<SaveStatus />
				</div>
			</Header>
			<div className="container mx-auto">
				{submitId ? (
					<Completed element={submitElement} />
				) : (
					<div className="grid grid-cols-4 px-6 py-12">
						<FormElementToggleProvider
							fieldSlugs={form.elements.reduce(
								(acc, e) => (e.slug ? [...acc, e.slug] : acc), // map to element.slug and filter out the undefined ones
								[] as string[]
							)}
						>
							<ContextEditorContextProvider
								pubId={pubId}
								pubTypeId={form.pubTypeId}
								pubs={pubs}
								pubTypes={pubTypes}
							>
								<ExternalFormWrapper
									pub={pubForForm}
									elements={form.elements}
									formSlug={form.slug}
									isUpdating={isUpdating}
									withAutoSave={isUpdating}
									withButtonElements
									isExternalForm
									className="col-span-2 col-start-2"
								>
									{form.elements.map((e) => (
										<FormElement
											key={e.id}
											pubId={pubId}
											element={e}
											searchParams={searchParams}
											communitySlug={params.communitySlug}
											values={pub ? pub.values : []}
										/>
									))}
								</ExternalFormWrapper>
							</ContextEditorContextProvider>
						</FormElementToggleProvider>
					</div>
				)}
			</div>
		</div>
	);
}
