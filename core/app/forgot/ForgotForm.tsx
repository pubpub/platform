"use client";
import React, { FormEvent, useState } from "react";
import Button from "components/Button";
import Input from "components/Input";
import SectionHeader from "components/SectionHeader";
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
			<SectionHeader text="Forgot Password" />

			{!success && (
				<>
					<p className="my-4">
						Enter your email below to receive a secure link for reseting yor password.
					</p>
					<div className="my-4">
						<form onSubmit={resetPassword}>
							<Input
								value={email}
								onChange={(evt) => setEmail(evt.target.value)}
								placeholder="example@mail.com"
							/>
							<Button
								type="submit"
								text={"Send password reset email"}
								primary
								isLoading={isLoading}
								disabled={!email}
							/>
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
