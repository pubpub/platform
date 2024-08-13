import type { ReactNode } from "react";

import { redirect, RedirectType } from "next/navigation";
import Markdown from "react-markdown";

import type { PubsId } from "db/public";

import type { Form } from "~/lib/server/form";
import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { isButtonElement } from "~/app/components/FormBuilder/types";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { getPub } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
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
				<Markdown className="prose self-center text-center">{element.content}</Markdown>
			) : (
				<h2 className="text-lg font-semibold">Form Successfully Submitted</h2>
			)}
		</div>
	);
};

export default async function FormPage({
	params,
	searchParams,
}: {
	params: { formSlug: string; communitySlug: string };
	searchParams: { email?: string; pubId?: PubsId };
}) {
	const community = await findCommunityBySlug(params.communitySlug);
	const form = await getForm({
		slug: params.formSlug,
		communityId: community?.id,
	}).executeTakeFirst();
	const pub = searchParams.pubId ? await getPub(searchParams.pubId) : undefined;

	if (!form) {
		return <NotFound>No form found</NotFound>;
	}

	// TODO: eventually, we will be able to create a pub
	if (!pub) {
		return <NotFound>No pub found</NotFound>;
	}

	const loginData = await getLoginData();

	// this is most likely what happens if a user clicks a link in an email
	// with an expired token, or a token that has been used already
	if (!loginData) {
		redirect(
			`/c/${params.communitySlug}/public/forms/${params.formSlug}/expired?email=${searchParams.email}&pubId=${searchParams.pubId}`,
			RedirectType.replace
		);
	}

	const role = getCommunityRole(loginData, { slug: params.communitySlug });
	if (!role) {
		return null;
	}

	const submitId: string | undefined = searchParams[SUBMIT_ID_QUERY_PARAM];
	const submitElement = form.elements.find((e) => isButtonElement(e) && e.elementId === submitId);

	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="text-xl font-bold">Evaluation for {community?.name}</h1>
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
								pubId={pub.id as PubsId}
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
