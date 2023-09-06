"use client";
import React, { FormEvent, useState } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";

export default function ForgotForm() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [failure, setFailure] = useState(false);

	const resetPassword = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();
		setIsLoading(true);
		setFailure(false);
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: "https://www.pubpub.org/reset",
		});
		if (error) {
			console.error(error);
			setFailure(true);
		} else {
			setSuccess(true);
		}
		setIsLoading(false);
	};

	return (
		<>
			{!success && (
				<>
					<p className="my-4">
						Enter your email below to receive a secure link for reseting yor password.
					</p>
					<div className="my-4">
						<form onSubmit={resetPassword}>
							<input
								value={email}
								onChange={(evt) => setEmail(evt.target.value)}
								placeholder="example@mail.com"
							/>
							<Button variant="outline" type="submit" disabled={!email}>
								Send password reset email
							</Button>
							{failure && (
								<div className={"text-red-700 my-4"}>Error reseting password</div>
							)}
						</form>
					</div>
				</>
			)}
			{success && (
				<div className="text-green-700 my-4">
					Password reset email sent! Please check your inbox.
				</div>
			)}
		</>
	);
}
