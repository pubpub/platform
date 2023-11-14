export const metadata = {
	title: "Sign In - Simple",
	description: "Page description",
};

import Link from "next/link";
import LoginForm from "./LoginForm";
import { getLoginData } from "~/lib/auth/loginData";
import { redirect } from "next/navigation";
import prisma from "~/prisma/db";

export default async function Login() {
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
	return (
		<section className="bg-gradient-to-b from-gray-100 to-white">
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-32 pb-12 md:pt-40 md:pb-20">
					{/* Page header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
						<h1 className="text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4">
							Welcome back to{" "}
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
								PubPub
							</span>
						</h1>
					</div>

					{/* Form */}
					<div className="max-w-sm mx-auto">
						<LoginForm />
						<div className="flex items-center my-6">
							<div
								className="border-t border-gray-300 grow mr-3"
								aria-hidden="true"
							></div>
							<div className="text-gray-600 italic">Or</div>
							<div
								className="border-t border-gray-300 grow ml-3"
								aria-hidden="true"
							></div>
						</div>
						<form>
							<div className="flex flex-wrap -mx-3">
								<div className="w-full px-3">
									<button className="btn px-0 text-white bg-orcid-500 hover:bg-orcid-700 w-full relative flex items-center">
										<svg
											className="w-4 h-4 fill-current text-white opacity-75 shrink-0 mx-4"
											width="24px"
											height="24px"
											viewBox="0 0 24 24"
											role="img"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>ORCID icon</title>
											<path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" />
										</svg>
										<span className="flex-auto pl-16 pr-8 -ml-16">
											Continue with orcid
										</span>
									</button>
								</div>
							</div>
						</form>
						<div className="text-gray-600 text-center mt-6">
							Don't have an account?{" "}
							<Link
								href="/signup"
								className="text-black hover:underline transition duration-150 ease-in-out"
							>
								Sign up
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
