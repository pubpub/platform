import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getLoginData } from "~/lib/authentication/loginData";
import { LogoWithText } from "../components/Logo";
import { Notice } from "../components/Notice";
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
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/50 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-2">
				<div className="flex items-center gap-2 self-center font-medium">
					<LogoWithText />
				</div>
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
		</div>
	);
}
