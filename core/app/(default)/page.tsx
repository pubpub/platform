import Hero from "./hero";
import Features from "./features";
import FeaturesBlocks from "./featureblocks";
import Testimonials from "./testimonials";
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
		});

		if (member) {
			redirect("/communities");
		} else {
			redirect("/join");
		}
	}
	return (
		<>
			<Hero />
			<Features />
			<FeaturesBlocks />
			<Testimonials />
		</>
	);
}
