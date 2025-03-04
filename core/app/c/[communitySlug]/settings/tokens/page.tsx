import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { NO_STAGE_OPTION } from "db/types";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { getPubTypesForCommunity } from "~/lib/server";
import { getApiAccessTokensByCommunity } from "~/lib/server/apiAccessTokens";
import { findCommunityBySlug } from "~/lib/server/community";
import { getStages } from "~/lib/server/stages";
import { CreateTokenFormWithContext } from "./CreateTokenForm";
import { ExistingToken } from "./ExistingToken";

export const metadata: Metadata = {
	title: "API Access Tokens",
};

export default async function Page(props: { params: { communitySlug: string } }) {
	const params = await props.params;
	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return notFound();
	}

	const [stages, pubTypes, existingTokens] = await Promise.all([
		getStages({ communityId: community.id, userId: user.id }).execute(),
		getPubTypesForCommunity(community.id),
		getApiAccessTokensByCommunity(community.id).execute(),
	]);

	return (
		<div className="container mx-auto px-4 py-12 md:px-6">
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
