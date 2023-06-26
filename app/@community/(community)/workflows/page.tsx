import prisma from "prisma/db";

export default async function Page() {
	/* Normally, we would get the community based on the url or logged in user session */
	const onlyCommunity = await prisma.community.findFirst();
	if (!onlyCommunity) {
		return null;
	}
	const workflows = await prisma.workflow.findMany({
		where: { communityId: onlyCommunity.id },
		include: {
			stages: {
				include: {
					moveConstraints: true,
				},
			},
		},
	});
	return (
		<>
			<h1>Workflows</h1>
			<pre>{JSON.stringify(workflows, null, 4)}</pre>
		</>
	);
}
