"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [failure, setFailure] = useState(false);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		setIsLoading(true);
		setFailure(false);
		evt.preventDefault();
		const { data, error } = await supabase.auth.updateUser({
			password,
		});
		if (error) {
			setIsLoading(false);
			setFailure(true);
		} else if (data) {
			setIsLoading(false);
			setSuccess(true);
			router.refresh();
			setTimeout(() => {
				router.push("/");
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
						<Button variant="outline" type="submit" disabled={!password}>
							Set new password
						</Button>
						{failure && (
							<div className={"text-red-700 my-4"}>Error reseting password</div>
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
