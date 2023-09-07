"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";
import Link from "next/link";

export default function LoginForm() {
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [failure, setFailure] = useState(false);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		setIsLoading(true);
		setFailure(false);
		evt.preventDefault();
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) {
			setIsLoading(false);
			setFailure(true);
		} else if (data) {
			window.location.href = "/";
		}
	};

	return (
		<>
			<h1>Login</h1>
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<p>
						<label htmlFor="email">Email</label>
						<input
							id="email"
							name="email"
							value={email}
							onChange={(evt) => setEmail(evt.target.value)}
						/>
					</p>
					<p>
						<label htmlFor="password">Password</label>
						<input
							id="password"
							name="password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>
					</p>

					<div className="my-6 flex space-x-8 items-center">
						<Button variant="outline" type="submit" disabled={!email || !password}>
							Login
						</Button>
						<Link href="/forgot" className="text-sm text-gray-600 hover:underline">
							Forgot Password
						</Link>
					</div>
					{failure && (
						<div className={"text-red-700 my-4"}>Incorrect password or email</div>
					)}
				</form>
			</div>
		</>
	);
}
