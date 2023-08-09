import prisma from "~/prisma/db";
import { redirect } from "next/navigation";
import { getLoginData } from "~/lib/auth/loginData";

export default async function Page() {
	const loginData = await getLoginData();
	if (loginData) {
		/* If we have a logged in user navigating to `/`, check */
		/* if they are a member of any community, and if so,    */
		/* redirect them to that community by default. We could */
		/* eventually have a query param override, but this     */
		/* assumes that logged in users landing on pubpub.org   */
		/* want to go to their dashboard a la github or twitter */
		/* TODO: Does not select for member-group access yet */
		const community = await prisma.community.findFirst({
			where: { members: { some: { userId: loginData.id } } },
			select: { slug: true },
		});
		if (community) {
			redirect(`/c/${community.slug}`);
		}
	}
	return (
		<>
			<h1>Home</h1>
		</>
	);
}
