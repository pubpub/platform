"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { formatSupabaseError, supabase } from "lib/supabase";
import { useRouter } from "next/navigation";

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
			if (member) {
				window.location.href = `/c/${member.community.slug}`;
			} else {
				window.location.href = "/settings";
			}
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
						<Button variant="outline" type="submit" disabled={!password}>
							Set new password
						</Button>
						{error && (
							<div className={"text-red-700 my-4"}>
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
