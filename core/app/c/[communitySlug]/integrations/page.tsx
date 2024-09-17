import type { Prisma } from "@prisma/client";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { getPageLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import prisma from "~/prisma/db";
import IntegrationsList from "./IntegrationsList";

export type IntegrationData = Prisma.PromiseReturnType<typeof getCommunityIntegrations>;

const getCommunityIntegrations = async (communitySlug: string) => {
	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});
	if (!community) {
		return null;
	}
	return await prisma.integrationInstance.findMany({
		where: { communityId: community.id },
		include: {
			integration: true,
			pubs: { include: { values: { include: { field: true } } } },
			stage: true,
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const integrations = await getCommunityIntegrations(params.communitySlug);
	if (!integrations) {
		return null;
	}

	const { user } = await getPageLoginData();

	const token = await createToken({ userId: user.id as UsersId, type: AuthTokenType.generic });

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Integrations</h1>
			</div>
			<IntegrationsList instances={integrations} token={token} />
		</>
	);
}
