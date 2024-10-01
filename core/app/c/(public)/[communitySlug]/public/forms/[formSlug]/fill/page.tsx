import { randomUUID } from "crypto";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import type { Communities, MembersId, PubsId, UsersId } from "db/public";
import { MemberRole, StructuralFormElement } from "db/public";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { isButtonElement } from "~/app/components/FormBuilder/types";
import { FormElement } from "~/app/components/forms/FormElement";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { getPub } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm, userHasPermissionToForm } from "~/lib/server/form";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { capitalize } from "~/lib/string";
import { SUBMIT_ID_QUERY_PARAM } from "./constants";
import { ExternalFormWrapper } from "./ExternalFormWrapper";
import { RequestLink } from "./RequestLink";
import { SaveStatus } from "./SaveStatus";
import { handleFormToken } from "./utils";

const NotFound = ({ children }: { children: ReactNode }) => {
	return <div className="w-full pt-8 text-center">{children}</div>;
};

const Completed = ({ element }: { element: Form["elements"][number] | undefined }) => {
	return (
		<div className="flex w-full flex-col gap-2 pt-32 text-center">
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
					pubId={searchParams.pubId as PubsId}
				/>
			</div>
		</div>
	);
};

const renderElementMarkdownContent = async (
	element: Form["elements"][number],
	renderWithPubContext: RenderWithPubContext
) => {
	if (element.content === null) {
		return "";
	}
	return renderMarkdownWithPub(element.content, renderWithPubContext);
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

	const [form, pub] = await Promise.all([
		getForm({
			slug: params.formSlug,
			communityId: community.id,
		}).executeTakeFirst(),
		searchParams.pubId ? await getPub(searchParams.pubId) : undefined,
	]);

	if (!form) {
		return <NotFound>No form found</NotFound>;
	}

	const { user, session } = await getLoginData();

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
		});

		if (!memberHasAccessToForm) {
			// TODO: show no access page
			return notFound();
		}
	}

	const parentPub = pub?.parentId ? await getPub(pub.parentId as PubsId) : undefined;

	const member = expect(user.memberships.find((m) => m.communityId === community?.id));

	const memberWithUser = {
		...member,
		id: member.id as MembersId,
		user: {
			...user,
			id: user.id as UsersId,
		},
	};

	const submitId: string | undefined = searchParams[SUBMIT_ID_QUERY_PARAM];
	const submitElement = form.elements.find((e) => isButtonElement(e) && e.elementId === submitId);

	if (submitId && submitElement) {
		if (pub) {
			// TODO: figure out when this is only after a pub is created
			const renderWithPubContext = {
				communityId: community.id,
				recipient: memberWithUser,
				communitySlug: params.communitySlug,
				pub,
				parentPub,
			};
			submitElement.content = await renderElementMarkdownContent(
				submitElement,
				renderWithPubContext
			);
		}
	} else if (pub) {
		const renderWithPubContext = {
			communityId: community.id,
			recipient: memberWithUser,
			communitySlug: params.communitySlug,
			pub,
			parentPub,
		};
		const elementsWithMarkdownContent = form.elements.filter(
			(element) => element.element === StructuralFormElement.p
		);
		await Promise.all(
			elementsWithMarkdownContent.map(async (element) => {
				element.content = await renderElementMarkdownContent(element, renderWithPubContext);
			})
		);
	}

	const isUpdating = !!pub;
	const pubId = pub?.id ?? (randomUUID() as PubsId);

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
						<ExternalFormWrapper
							pubId={pubId as PubsId}
							pubValues={pub ? pub.values : {}}
							elements={form.elements}
							isUpdating={isUpdating}
							className="col-span-2 col-start-2"
						>
							{form.elements.map((e) => (
								<FormElement
									key={e.elementId}
									pubId={pubId as PubsId}
									element={e}
									searchParams={searchParams}
									communitySlug={params.communitySlug}
									values={pub ? pub.values : {}}
								/>
							))}
						</ExternalFormWrapper>
					</div>
				)}
			</div>
		</div>
	);
}
