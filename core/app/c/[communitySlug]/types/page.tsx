import { Prisma } from "@prisma/client";
import prisma from "@/core/prisma/db";
import TypeList from "./TypeList";

export type TypesData = Prisma.PromiseReturnType<typeof getTypes>;

const getTypes = async (communitySlug: string) => {
	return prisma.pubType.findMany({
		where: {
			community: {
				slug: communitySlug,
			},
		},
		include: {
			fields: true,
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const types = await getTypes(params.communitySlug);
	if (!types) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Types</h1>
			<TypeList types={types} />
		</>
	);
}
