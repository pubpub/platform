import { notFound, redirect } from "next/navigation";

import { pubPath } from "~/lib/paths";
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
	redirect(pubPath(pub.community.slug, pub.slug));
}
