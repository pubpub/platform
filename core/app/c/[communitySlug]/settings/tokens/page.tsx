import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { Capabilities, MembershipType } from "db/public";
import { NO_STAGE_OPTION } from "db/types";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getAllPubTypesForCommunity } from "~/lib/server";
import { getApiAccessTokensByCommunity } from "~/lib/server/apiAccessTokens";
import { findCommunityBySlug } from "~/lib/server/community";
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects";
import { getStages } from "~/lib/server/stages";
import { CreateTokenFormWithContext } from "./CreateTokenForm";
import { ExistingToken } from "./ExistingToken";

export const metadata: Metadata = {
	title: "API Access Tokens",
};

export default async function Page(props: { params: { communitySlug: string } }) {
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()]);

	if (!community) {
		return notFound();
	}

	if (!user) {
		return redirectToLogin();
	}

	const [canEditCommunity, stages, pubTypes, existingTokens] = await Promise.all([
		userCan(
			Capabilities.editCommunity,
			{
				communityId: community.id,
				type: MembershipType.community,
			},
			user.id
		),
		getStages({ communityId: community.id, userId: user.id }).execute(),
		getAllPubTypesForCommunity(community.slug).execute(),
		getApiAccessTokensByCommunity(community.id).execute(),
	]);

	if (!canEditCommunity) {
		return redirectToUnauthorized();
	}

	return (
		<div className="container ml-0 max-w-screen-md px-4 py-12 md:px-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Access Tokens</h1>
					<p className="text-muted-foreground">
						Manage granular access tokens for your application. Create, revoke, and
						monitor token usage.
					</p>
				</div>
				<div className="grid gap-6">
					{existingTokens.length > 0 && (
						<div className="grid gap-2">
							<h2 className="text-xl font-semibold">Existing Tokens</h2>
							<div className="grid gap-4 overflow-auto">
								{existingTokens.map((token) => (
									<ExistingToken key={token.id} token={token} />
								))}
							</div>
						</div>
					)}
					<CreateTokenFormWithContext
						stages={{
							stages,
							allOptions: [
								NO_STAGE_OPTION,
								...stages.map((stage) => ({ label: stage.name, value: stage.id })),
							],
							allValues: [NO_STAGE_OPTION.value, ...stages.map((stage) => stage.id)],
						}}
						pubTypes={{
							pubTypes,
							allOptions: pubTypes.map((pubType) => ({
								label: pubType.name,
								value: pubType.id,
							})),
							allValues: pubTypes.map((pubType) => pubType.id),
						}}
					/>
				</div>
			</div>
		</div>
	);
}
