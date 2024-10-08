import { notFound, redirect } from "next/navigation";

import prisma from "~/prisma/db";

export type Props = {
	params: {
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const pub = await prisma.pub.findUnique({
		where: { id: props.params.pubId },
		include: {
			community: {
				select: {
					slug: true,
				},
			},
		},
	});
	if (pub === null) {
		notFound();
	}
	redirect(`/c/${pub.community.slug}/pubs/${pub.id}`);
}
