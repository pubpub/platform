import Link from "next/link";
import { Button } from "ui";
import { renderPubTitle } from "~/app/components/lib/utils";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import Pub from "./Pub";

const getPubForSlug = async (slug: string) => {
	return await prisma.pub.findUnique({
		where: { slug },
		include: {
			...pubInclude,
		},
	});
};

export default async function Page({
	params,
}: {
	params: { slug: string; communitySlug: string };
}) {
	if (!params.slug || !params.communitySlug) {
		return null;
	}
	const pub = await getPubForSlug(params.slug);
	if (!pub) {
		return null;
	}
	return (
		<div>
			<Link href={`/c/${params.communitySlug}/pubs`}>
				<Button>View all pubs</Button>
			</Link>

			<h3>{pub.pubType.name}</h3>
			{renderPubTitle(pub)}
			<Pub pub={pub} />
		</div>
	);
}
