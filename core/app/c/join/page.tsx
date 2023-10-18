import { Button, Input } from "ui";
import { getLoginData } from "~/lib/auth/loginData";
import LogoutButton from "../[communitySlug]/LogoutButton";

export default async function Page() {
	const loginData = await getLoginData();

	return (
		<section className="bg-gradient-to-b from-gray-100 to-white">
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-32 pb-12 md:pt-40 md:pb-20">
					{/* Page header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
						<h1 className="text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4">
							Welcome back{" "}
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
								{loginData?.firstName + " " + loginData?.lastName}
							</span>
						</h1>
						<br />
						<h3 className="text-2xl md:text-3xl font-extrabold leading-tighter tracking-tighter mb-4">
							{" "}
							Enter your community invite link to proceed
						</h3>
					</div>

					{/* Form */}
					<div className="max-w-sm mx-auto">
						<Input className="flex items-center my-6" />
						<div className="flex justify-center">
							<Button type="submit" className="btn  w-full">
								Continue
							</Button>
						</div>
						<LogoutButton />
					</div>
				</div>
			</div>
		</section>
	);
}
