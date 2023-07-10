import { Prisma } from "@prisma/client";
import prisma from "prisma/db";
import IntegrationsList from "./IntegrationsList";

export type IntegrationData = Prisma.PromiseReturnType<typeof getCommunityIntegrations>;

const getCommunityIntegrations = async () => {
	/* Normally, we would get the community based on the url or logged in user session */
	const onlyCommunity = await prisma.community.findFirst();
	if (!onlyCommunity) {
		return null;
	}
	return await prisma.integrationInstance.findMany({
		where: { communityId: onlyCommunity.id },
		include: {
			integration: true,
			pubs: { include: { values: { include: { field: true } } } },
			stages: { include: { workflow: true } },
			// stages: {
			// 	include: {
			// 		pubs: {
			// 			include: {
			// 				pubType: true,
			// 				values: { include: { field: true } },
			// 				stages: {
			// 					include: {
			// 						integrationInstances: { include: { integration: true } },
			// 					},
			// 				},
			// 				integrationInstances: { include: { integration: true } },
			// 			},
			// 		},
			// 		integrationInstances: { include: { integration: true } },
			// 	},
			// },
		},
	});
};

export default async function Page() {
	const integrations = await getCommunityIntegrations();
	if (!integrations) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Integrations</h1>
			<IntegrationsList instances={integrations} />
		</>
	);
}
