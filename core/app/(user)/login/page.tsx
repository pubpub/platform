import Link from "next/link";
import { redirect } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";
import LoginForm from "./LoginForm";

export default async function Login() {
	const { user } = await getLoginData();
	// if user and no commuhnmitiy, redirect to settings
	if (user?.id) {
		const firstSlug = user.memberships[0]?.community?.slug;

		if (firstSlug) {
			redirect(`/c/${firstSlug}/stages`);
		}

		redirect("/settings");
	}

	return (
		<div className="mx-auto max-w-sm">
			<LoginForm />

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
