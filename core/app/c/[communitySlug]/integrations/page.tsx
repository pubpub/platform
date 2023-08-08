import { Prisma } from "@prisma/client";
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
			stages: true,
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

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const integrations = await getCommunityIntegrations(params.communitySlug);
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
