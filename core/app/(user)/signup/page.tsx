"use client";
import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { UserPostBody } from "~/lib/types";

export default function Page() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [signupComplete, setSignupComplete] = useState(false);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();

		setIsLoading(true);
		const postBody: UserPostBody = {
			firstName,
			lastName,
			password,
			email,
		};
		const response = await fetch("/api/user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(postBody),
		});
		if (!response.ok) {
			setIsLoading(false);
			const { message } = await response.json();
			console.error(message);
		} else {
			setIsLoading(false);
			setSignupComplete(true);
		}
	};

	return (
		<div className="border p-4 bg-white">
			<section className="bg-gradient-to-b from-gray-100 to-white">
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="pt-32 pb-12 md:pt-40 md:pb-20">
						{/* Page header */}
						<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
							<h1 className="h1">
								Welcome. We exist. <br /> <br /> So watch out 😈
							</h1>
						</div>

						{/* Form */}
						<div className="max-w-sm mx-auto">
							{!signupComplete && (
								<>
									<div className="my-10">
										<form onSubmit={handleSubmit}>
											<div>
												<label htmlFor="lastName">Name</label>
											</div>
											<div>
												<input
													id="firstName"
													className="w-full"
													placeholder="First Name"
													name="firstName"
													value={firstName}
													onChange={(evt) =>
														setFirstName(evt.target.value)
													}
												/>
											</div>
											<br />
											<div>
												<input
													id="lastName"
													className="w-full"
													placeholder="Last Name"
													name="lastName"
													value={lastName}
													onChange={(evt) =>
														setLastName(evt.target.value)
													}
												/>
											</div>
											<div className="mt-2">
												<label htmlFor="email">Email</label>
											</div>
											<div>
												<input
													id="email"
													className="w-full"
													placeholder="Email"
													name="email"
													value={email}
													onChange={(evt) => setEmail(evt.target.value)}
												/>
											</div>
											<div className="mt-2">
												<label htmlFor="password">Password</label>
											</div>
											<div>
												<input
													id="password"
													className="w-full"
													placeholder="Password"
													name="Password"
													value={password}
													type="password"
													onChange={(evt) =>
														setPassword(evt.target.value)
													}
												/>
											</div>
											<div className="mt-4 text-center">
												<Button
													variant="outline"
													type="submit"
													disabled={!firstName || !email || !password}
												>
													Create Account
												</Button>
											</div>
										</form>
									</div>
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
									<div>
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
									</div>
								</>
							)}
							{signupComplete && (
								<div className="text-center">
									<h2 className="text-2xl font-bold">Welcome!</h2>
									<div>
										We've sent you a verification email - click the link in that
										message to finish your signup.
									</div>
								</div>
							)}

							<div className="text-gray-600 text-center mt-6">
								Already using PubPub?{" "}
								<Link
									href="/login"
									className="text-blue-600 hover:underline transition duration-150 ease-in-out"
								>
									Log in
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
