import type { ReactNode } from "react";

import { redirect, RedirectType } from "next/navigation";

import type { MembersId, PubsId, UsersId } from "db/public";
import { StructuralFormElement } from "db/public";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { isButtonElement } from "~/app/components/FormBuilder/types";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { getPub } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { capitalize } from "~/lib/string";
import { SUBMIT_ID_QUERY_PARAM } from "./constants";
import { ExternalFormWrapper } from "./ExternalFormWrapper";
import { InnerForm } from "./InnerForm";
import { SaveStatus } from "./SaveStatus";

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

const renderElementMarkdownContent = async (
	element: Form["elements"][number],
	renderWithPubContext: RenderWithPubContext
) => {
	const content = expect(element.content, "Expected element to have content");
	return renderMarkdownWithPub(content, renderWithPubContext);
};

export default async function FormPage({
	params,
	searchParams,
}: {
	params: { formSlug: string; communitySlug: string };
	searchParams: { email?: string; pubId?: PubsId };
}) {
	const community = await findCommunityBySlug(params.communitySlug);

	const [form, pub] = await Promise.all([
		getForm({
			slug: params.formSlug,
			communityId: community?.id,
		}).executeTakeFirst(),
		searchParams.pubId ? await getPub(searchParams.pubId) : undefined,
	]);

	if (!form) {
		return <NotFound>No form found</NotFound>;
	}

	// TODO: eventually, we will be able to create a pub
	if (!pub) {
		return <NotFound>No pub found</NotFound>;
	}

	const { user, session } = await getLoginData();

	// this is most likely what happens if a user clicks a link in an email
	// with an expired token, or a token that has been used already
	// TODO: check the auth failure reason here
	// if it's due to an invalid token, allow the user to request a new one
	if (!user) {
		redirect(
			`/c/${params.communitySlug}/public/forms/${params.formSlug}/expired?email=${searchParams.email}&pubId=${searchParams.pubId}`,
			RedirectType.replace
		);
	}

	const role = getCommunityRole(user, { slug: params.communitySlug });
	if (!role) {
		return null;
	}

	const parentPub = pub.parentId ? await getPub(pub.parentId as PubsId) : undefined;

	const member = expect(user.memberships.find((m) => m.communityId === community?.id));
	const memberWithUser = {
		...member,
		id: member.id as MembersId,
		user: {
			...user,
			id: user.id as UsersId,
		},
	};
	const renderWithPubContext = {
		recipient: memberWithUser,
		communitySlug: params.communitySlug,
		pub,
		parentPub,
	};
	const submitId: string | undefined = searchParams[SUBMIT_ID_QUERY_PARAM];
	const submitElement = form.elements.find((e) => isButtonElement(e) && e.elementId === submitId);

	if (submitId && submitElement) {
		submitElement.content = await renderElementMarkdownContent(
			submitElement,
			renderWithPubContext
		);
	} else {
		const elementsWithMarkdownContent = form.elements.filter(
			(element) => element.element === StructuralFormElement.p
		);
		await Promise.all(
			elementsWithMarkdownContent.map(async (element) => {
				element.content = await renderElementMarkdownContent(element, renderWithPubContext);
			})
		);
	}

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
							pub={pub}
							elements={form.elements}
							className="col-span-2 col-start-2"
						>
							<InnerForm
								pub={pub}
								elements={form.elements}
								// The following params are for rendering UserSelectServer
								communitySlug={params.communitySlug}
								searchParams={searchParams}
								values={pub.values}
							/>
						</ExternalFormWrapper>
					</div>
				)}
			</div>
		</div>
	);
}
