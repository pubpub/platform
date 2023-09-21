import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import IntegrationsList from "./IntegrationsList";
import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";

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

	const loginData = await getLoginData();
	let token;
	if (loginData) {
		token = await createToken(loginData.id);
	}
	return (
		<>
			<div className="flex mb-16 justify-between items-center">
				<h1 className="font-bold text-xl">Integrations</h1>
			</div>
			<IntegrationsList instances={integrations} token={token} />
		</>
	);
}
