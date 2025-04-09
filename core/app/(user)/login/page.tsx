import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getLoginData } from "~/lib/authentication/loginData";
import { Notice } from "../../components/Notice";
import LoginForm from "./LoginForm";

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
			{notice && <Notice type="notice" title={notice} body={body} />}
			{error && <Notice type="error" title={error} body={body} />}
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
