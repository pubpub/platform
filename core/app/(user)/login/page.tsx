import Link from "next/link";
import { redirect } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";
import LoginForm from "./LoginForm";
import { Notice } from "./Notice";

export default async function Login({
	searchParams,
}: {
	searchParams: {
		error?: string;
	};
}) {
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
			<Notice
				variant={searchParams.error ? "destructive" : "default"}
				title={searchParams.error ? "Error" : "Login system update"}
				description={
					searchParams?.error || (
						<p>
							We've migrated our login system. If you have trouble logging in, you
							need to reset your password.{" "}
							<Link
								href="/forgot"
								className="font-medium underline underline-offset-4"
							>
								Click here
							</Link>{" "}
							and we'll send you a password reset email.
						</p>
					)
				}
			/>
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
