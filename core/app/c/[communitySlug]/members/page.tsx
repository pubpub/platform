import { Prisma } from "@prisma/client";
import prisma
 from "~/prisma/db";
const getCommunityMember = Prisma.mem;
export default function Page() {
	return (
		<>
			<h1>Members</h1>
		</>
	);
}
