"use client";
import React, { FormEvent, useState } from "react";
import { Button } from "ui/button";
import { Loader2 } from "ui/icon";

import { supabase } from "lib/supabase";
import { useEnvContext } from "next-runtime-env";
import { logger } from "logger";

export default function ForgotForm() {
	const { NEXT_PUBLIC_PUBPUB_URL } = useEnvContext();

	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [failure, setFailure] = useState(false);

	const resetPassword = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();
		setIsLoading(true);
		setFailure(false);
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${NEXT_PUBLIC_PUBPUB_URL}/reset`,
		});
		if (error) {
			logger.error(error);
			setFailure(true);
		} else {
			setSuccess(true);
		}
		setIsLoading(false);
	};

	return (
		<div className="border p-4">
			{!success && (
				<>
					<p className="my-4">
						Enter your email below to receive a secure link for reseting yor password.
					</p>
					<div className="text-center">
						<form
							onSubmit={resetPassword}
							className="flex justify-between items-center"
						>
							<input
								className="w-1/2 mr-4"
								value={email}
								onChange={(evt) => setEmail(evt.target.value)}
								placeholder="example@mail.com"
							/>

							<Button variant="outline" type="submit" disabled={!email || isLoading}>
								Send password reset email
								{isLoading && <Loader2 className="h-4 w-4 ml-4 animate-spin" />}
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
		</div>
	);
}
