"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";
import Link from "next/link";

let prisma;

export default function LoginForm() {
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [failure, setFailure] = useState(false);

	async function handleSubmit(evt: FormEvent<EventTarget>) {
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
			// check if user is in a community
			const response = await fetch(`/api/member?email=${data.user.email}`, {
				method: "GET",
				headers: { "content-type": "application/json" },
			});
			const { member } = await response.json();
			setIsLoading(false);
			if (member) {
				window.location.href = `/c/${member.community.slug}`;
			} else {
				window.location.href = "/settings";
			}
		}
	}

	return (
		<div className="border p-4">
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<div>
						<label htmlFor="email">Email</label>
					</div>
					<div>
						<input
							id="email"
							className="w-full"
							placeholder="Enter your email address"
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
							placeholder="Enter your password"
							name="password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>
					</div>

					<div className="my-6 text-center">
						<Button className="mr-4" type="submit" disabled={!email || !password}>
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
