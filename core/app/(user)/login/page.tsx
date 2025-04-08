import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getLoginData } from "~/lib/authentication/loginData";
import LoginForm from "./LoginForm";
import { Notice } from "./Notice";

export default async function Login({
	searchParams,
}: {
	searchParams: Promise<{
		error?: string;
		notice?: string;
		body?: string;
	}>;
}) {
	const { user } = await getLoginData();

	if (user?.id) {
		const firstSlug = user.memberships[0]?.community?.slug;
		const cookieStore = await cookies();
		const lastVisited = cookieStore.get(LAST_VISITED_COOKIE);
		const communitySlug = lastVisited?.value ?? firstSlug;

		if (firstSlug) {
			redirect(`/c/${communitySlug}/stages`);
		}

		redirect("/settings");
	}

	const { notice, error, body } = await searchParams;

	return (
		<div className="mx-auto max-w-sm">
			<LoginForm />
			{notice && <Notice variant="default" title={notice} description={body} />}
			{error && <Notice variant="destructive" title={error} description={body} />}
			{/* <div className="text-gray-600 text-center mt-6">
				Don't have an account?{" "}
				<Link
					href="/signup"
					className="text-black hover:underline transition duration-150 ease-in-out"
				>
					Sign up
				</Link>
			</div> */}
		</div>
	);
}
