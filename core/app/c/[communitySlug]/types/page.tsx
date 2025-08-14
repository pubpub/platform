import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { Capabilities, MembershipType } from "db/public";
import { FormInput, ToyBrick } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { redirectToLogin } from "~/lib/server/navigation/redirects";
import { getPubFields } from "~/lib/server/pubFields";
import { getAllPubTypesForCommunity, getPubTypesForCommunity } from "~/lib/server/pubtype";
import { ContentLayout } from "../ContentLayout";
import { CreatePubTypeButton } from "./CreatePubType";
import TypeList from "./TypeList";
import { TypesTable } from "./TypesTable";

export const metadata: Metadata = {
	title: "Pub Types",
};

export default async function Page(props: {
	params: Promise<{
		communitySlug: string;
	}>;
}) {
	const params = await props.params;

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	]);
	if (!user) {
		redirectToLogin();
	}

	if (!user || !community) {
		return notFound();
	}

	const [canEditCommunity, types, { fields }] = await Promise.all([
		await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),
		getPubTypesForCommunity(community.id, {
			limit: 1000,
		}),
		getPubFields({
			communityId: community.id,
		}).executeTakeFirstOrThrow(),
	]);

	//TODO: Add capability to allow non-admins to view this page
	if (!canEditCommunity) {
		redirect(`/c/${community.slug}/unauthorized`);
	}

	if (!types || !fields) {
		return null;
	}

	return (
		<PubFieldProvider pubFields={fields}>
			<ContentLayout
				title={
					<>
						<ToyBrick size={24} strokeWidth={1} className="mr-2 text-gray-500" /> Types
					</>
				}
				right={<CreatePubTypeButton />}
			>
				<div className="m-4">
					<TypesTable types={types} />
				</div>
			</ContentLayout>
		</PubFieldProvider>
	);
}
