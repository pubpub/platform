import Hero from "./hero";
import Features from "./features";
import FeaturesBlocks from "./featureblocks";
import Testimonials from "./testimonials";

export default async function Page() {
	return (
		<>
			<Hero />
			<Features />
			<FeaturesBlocks />
			<Testimonials />
		</>
	);
}
