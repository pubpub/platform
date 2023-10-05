"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { UserPostBody } from "app/api/user/route";

export default function SignupForm() {
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [signupComplete, setSignupComplete] = useState(false);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();

		setIsLoading(true);
		const postBody: UserPostBody = {
			name,
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
		<div className="border p-4">
			{!signupComplete && (
				<>
					<h1 className="text-2xl text-center">Signup</h1>
					<div className="my-10">
						<form onSubmit={handleSubmit}>
							<div>
								<label htmlFor="name">Name</label>
							</div>
							<div>
								<input
									id="name"
									className="w-full"
									name="name"
									value={name}
									onChange={(evt) => setName(evt.target.value)}
								/>
							</div>
							<div className="mt-2">
								<label htmlFor="email">Email</label>
							</div>
							<div>
								<input
									id="email"
									className="w-full"
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
									name="Password"
									value={password}
									type="password"
									onChange={(evt) => setPassword(evt.target.value)}
								/>
							</div>
							<div className="mt-4 text-center">
								<Button
									variant="outline"
									type="submit"
									disabled={!name || !email || !password}
								>
									Create Account
								</Button>
							</div>
						</form>
					</div>
				</>
			)}
			{signupComplete && (
				<div className="text-center">
					<h2 className="text-2xl font-bold">Welcome!</h2>
					<div>
						We've sent you a verification email - click the link in that message to
						finish your signup.
					</div>
				</div>
			)}
		</div>
	);
}
