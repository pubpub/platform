"use client";
import React, { useState, FormEvent } from "react";
import SHA3 from "crypto-js/sha3";
import encHex from "crypto-js/enc-hex";
import Button from "components/Button";
import { UserPostBody } from "pages/api/user";
import Input from "components/Input";
import SectionHeader from "components/SectionHeader";
import AvatarSelector from "components/AvatarSelector";

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
					<SectionHeader text="Signup" />
					<div className="my-10">
						<form onSubmit={handleSubmit}>
							<Input
								label="Name"
								value={name}
								onChange={(evt) => setName(evt.target.value)}
							/>
							<Input
								label="Email"
								value={email}
								onChange={(evt) => setEmail(evt.target.value)}
							/>
							<Input
								label="Password"
								value={password}
								type="password"
								onChange={(evt) => setPassword(evt.target.value)}
							/>
							<Button
								className="mt-4"
								type="submit"
								text="Create Account"
								primary
								isLoading={isLoading}
								disabled={!name || !email || !password}
							/>
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
