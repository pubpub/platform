import { getLoginData } from "~/lib/auth/loginData";
import { redirect } from "next/navigation";
import prisma from "~/prisma/db";

export default async function Page() {
	const loginData = await getLoginData();
	// if user and no commuhnmitiy, redirect to join
	if (loginData) {
		let user;
		try {
			user = await prisma.user.findUnique({
				where: { email: loginData.email },
			});
		} catch {
			throw new Error("No user found");
		}

		const member = await prisma.member.findFirst({
			where: { userId: user.id },
			include: { community: true },
		});

		if (member) {
			redirect(`/c/${member.community.slug}`);
		} else {
			redirect("/settings");
		}
	}
	return <>Home...</>;
}
