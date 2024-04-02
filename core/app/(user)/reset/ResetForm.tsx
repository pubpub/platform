"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { formatSupabaseError, supabase } from "lib/supabase";
import { Button } from "ui/button";
import { Loader2 } from "ui/icon";

export default function ResetForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		setIsLoading(true);
		setError("");
		evt.preventDefault();
		const { data, error } = await supabase.auth.updateUser({
			password,
		});
		if (error) {
			setIsLoading(false);
			setError(formatSupabaseError(error));
		} else if (data) {
			setIsLoading(false);
			setSuccess(true);
			router.refresh();
			// check if user is in a community
			const response = await fetch(`/api/member?email=${data.user.email}`, {
				method: "GET",
				headers: { "content-type": "application/json" },
			});
			const { member } = await response.json();
			setIsLoading(false);
			setTimeout(() => {
				if (member) {
					router.push(`/c/${member.community.slug}/stages`);
				} else {
					router.push("/settings");
				}
			}, 5000);
		}
	};

	return (
		<>
			{!success && (
				<div className="my-10">
					<form onSubmit={handleSubmit}>
						<label htmlFor="password">Password</label>
						<input
							name="password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>

						<Button variant="outline" type="submit" disabled={!password || isLoading}>
							Set new password
							{isLoading && <Loader2 className="ml-4 h-4 w-4 animate-spin" />}
						</Button>

						{error && (
							<div className={"my-4 text-red-700"}>
								Error resetting password: {error}
							</div>
						)}
					</form>
				</div>
			)}
			{success && (
				<div className="my-10">
					<div className="text-green-700">Success - password reset!</div>
					<div>Redirecting in 5 seconds...</div>
				</div>
			)}
		</>
	);
}
