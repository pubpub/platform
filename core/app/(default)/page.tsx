import prisma from "~/prisma/db";
import { redirect } from "next/navigation";
import Hero from "./hero";
import Features from "./features";
import FeaturesBlocks from "./featureblocks";
import Testimonials from "./testimonials";
import { handleRedirect } from "~/lib/auth/loginData";

export default async function Page() {
	await handleRedirect();
	return (
		<>
			<Hero />
			<Features />
			<FeaturesBlocks />
			<Testimonials />
		</>
	);
}
