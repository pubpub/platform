import type { ReactNode } from "react";

import { redirect, RedirectType } from "next/navigation";

import type { PubsId } from "db/public";

import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { getPub } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { COMPLETE_STATUS, SAVE_STATUS_QUERY_PARAM } from "./constants";
import { ExternalFormWrapper } from "./ExternalFormWrapper";
import { InnerForm } from "./InnerForm";
import { ParentPubInfo } from "./ParentPubInfo";
import { SaveStatus } from "./SaveStatus";

const NotFound = ({ children }: { children: ReactNode }) => {
	return <div className="w-full pt-8 text-center">{children}</div>;
};

// TODO: will be configured in the future
const Completed = () => {
	return (
		<div className="flex w-full flex-col gap-2 pt-32 text-center">
			<h2 className="text-lg font-semibold">Form Successfully Submitted</h2>
			<p className="text-sm">Nice work!</p>
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
	const form = await getForm({ slug: params.formSlug }).executeTakeFirst();
	const pub = searchParams.pubId ? await getPub(searchParams.pubId) : undefined;
	const community = await findCommunityBySlug(params.communitySlug);

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
			`/c/${params.communitySlug}/public/forms/${params.formSlug}/expired?email=${searchParams.email}`,
			RedirectType.replace
		);
	}

	const role = getCommunityRole(loginData, { slug: params.communitySlug });
	if (!role) {
		return null;
	}

	const completed = searchParams[SAVE_STATUS_QUERY_PARAM] === COMPLETE_STATUS;

	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="text-xl font-bold">Evaluation for {community?.name}</h1>
					<SaveStatus />
				</div>
			</Header>
			<div className="container mx-auto">
				{completed ? (
					<Completed />
				) : (
					<div className="grid w-full grid-cols-4 gap-16 px-6 py-12">
						<div className="col-span-1">
							<ParentPubInfo parentId={pub.parentId} />
						</div>
						<div className="col-span-2">
							<ExternalFormWrapper
								pub={pub}
								elements={form.elements}
								className="flex-1"
							>
								<InnerForm
									elements={form.elements}
									// The following params are for rendering UserSelectServer
									communitySlug={params.communitySlug}
									searchParams={searchParams}
									values={pub.values}
								/>
							</ExternalFormWrapper>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
