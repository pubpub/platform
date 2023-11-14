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
			<section>
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="pt-32 pb-12 md:pt-40 md:pb-20">
						{/* Page header */}
						<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
							<h1 className="text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4">
								Welcome to{" "}
								<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
									PubPub
								</span>
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
