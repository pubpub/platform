"use client";
import React, { useState, FormEvent } from "react";
import SHA3 from "crypto-js/sha3";
import encHex from "crypto-js/enc-hex";
import { Button } from "ui";
import { UserPostBody } from "pages/api/user";

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
			password: SHA3(password).toString(encHex),
			email,
		};
		const response = await fetch("/api/user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(postBody),
		});
		const data = await response.json();
		if (data.error) {
			setIsLoading(false);
			console.error(data.error);
		} else {
			setIsLoading(false);
			setSignupComplete(true);
		}
	};

	return (
		<>
			{!signupComplete && (
				<>
					<h1>Signup</h1>
					<div className="my-10">
						<form onSubmit={handleSubmit}>
							<label htmlFor="name">Name</label>
							<input
								name="name"
								value={name}
								onChange={(evt) => setName(evt.target.value)}
							/>
							<label htmlFor="email">Email</label>
							<input
								name="email"
								value={email}
								onChange={(evt) => setEmail(evt.target.value)}
							/>
							<label htmlFor="password">Password</label>
							<input
								name="Password"
								value={password}
								type="password"
								onChange={(evt) => setPassword(evt.target.value)}
							/>
							<Button
								variant="outline"
								className="mt-4"
								type="submit"
								disabled={!name || !email || !password}
							>
								Create Account
							</Button>
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
		</>
	);
}
