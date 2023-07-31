import { Prisma } from "@prisma/client";
import prisma from "prisma/db";
import WorkflowList from "./WorkflowList";

export type WorkflowsData = Prisma.PromiseReturnType<typeof getCommunityWorkflows>;

const getCommunityWorkflows = async () => {
	/* Normally, we would get the community based on the url or logged in user session */
	const onlyCommunity = await prisma.community.findFirst();
	if (!onlyCommunity) {
		return null;
	}
	// When trying to render the workflows a member can see. We look at the pubs they can see, get the workflows associated, and then show all those.  
	return await prisma.workflow.findMany({
		where: { communityId: onlyCommunity.id },
		include: {
			stages: {
				include: {
					pubs: {
						include: {
							pubType: true,
							values: { include: { field: true } },
							stages: {
								include: {
									integrationInstances: { include: { integration: true } },
								},
							},
							integrationInstances: { include: { integration: true } },
						},
					},
					integrationInstances: { include: { integration: true } },
				},
			},
		},
	});
};

export default async function Page() {
	const workflows = await getCommunityWorkflows();
	if (!workflows) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Workflows</h1>
			<WorkflowList workflows={workflows}/>
		</>
	);
}
