import { Prisma } from "@prisma/client";
import prisma from "prisma/db";
import TypeList from "./TypeList";

export type TypesData = Prisma.PromiseReturnType<typeof getTypes>;

const getTypes = async () => {
	return prisma.pubType.findMany({
		include: {
			fields: true
		},
	});
};


export default async function Page() {
	const types = await getTypes();
	if (!types) {
		return null;
	}
	return (
		<>
			<h1 style={{marginBottom: "2em"}}>Types</h1>
			<TypeList types={types}  />
		</>
	);
}
