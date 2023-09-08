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
		<div className="border p-4">
			<h1 className="text-2xl text-center">Login</h1>
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<div>
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
							name="password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>
					</div>

					<div className="my-6 text-center">
						<Button
							className="mr-4"
							variant="outline"
							type="submit"
							disabled={!email || !password}
						>
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
		</div>
	);
}
