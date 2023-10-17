import prisma from "~/prisma/db";
import { redirect } from "next/navigation";
import { getLoginData } from "~/lib/auth/loginData";
import Link from "next/link";
import SignupForm from "./(user)/signup/SignupForm";

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
		<div className=" flex flex-col min-h-screen">
			<div className="bg-black py-6">
				<div className="container mx-auto text-center">
					<h1 className="text-4xl font-semibold text-white">Welcome to PubPub</h1>
					<p className="text-lg text-gray-200 mt-2">
						Your platform for creating publishing workflows.
					</p>
				</div>
			</div>

			<div className="flex container mx-auto py-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="md:col-span-1">
						<h2 className="text-3xl font-semibold mb-4">What We Offer</h2>
						<p className="text-gray-600">
							PubPub is a versatile platform that allows academics, artists, and
							independent research communities to create, customize, and manage their
							publishing workflows. With PubPub, you can:
						</p>
						<ul className="mt-4 list-disc list-inside text-gray-600">
							<li>Create and customize your publishing process.</li>
							<li>Collaborate with peers and reviewers.</li>
							<li>Manage and publish your work effortlessly.</li>
							<li>Explore a community of like-minded individuals.</li>
						</ul>
					</div>

					<div className="md:col-span-1">
						<img
							src="/illustration.png" // Add your illustration image
							alt="PubPub Illustration"
							className="w-full h-auto"
						/>
					</div>
				</div>
			</div>

			<div className="flex bg-black py-8 flex-grow">
				<div className="container mx-auto text-center">
					<h2 className="text-3xl font-semibold text-white">Ready to Get Started?</h2>
					<p className="text-gray-200 mt-2">
						Join PubPub today and unlock the power of collaborative publishing.
					</p>
					<div className="max-w-lg m-auto">
						<SignupForm />
					</div>
				</div>
			</div>
		</div>
	);
}
