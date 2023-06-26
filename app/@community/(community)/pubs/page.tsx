import prisma from "prisma/db";

export default async function Page() {
	/* Normally, we would get the community based on the url or logged in user session */
	const onlyCommunity = await prisma.community.findFirst();
	if (!onlyCommunity) {
		return null;
	}
	const pubs = await prisma.pub.findMany({
		where: { communityId: onlyCommunity.id, parentId: null },
		include: {
			pubType: {
				include: {
					metadataFields: true,
				},
			},
			metadataValues: true,
			children: {
				include: {
					pubType: {
						include: {
							metadataFields: true,
						},
					},
					metadataValues: true,
				},
			},
		},
	});
	return (
		<>
			<h1>Pubs</h1>
			<pre>{JSON.stringify(pubs, null, 4)}</pre>
		</>
	);
}
