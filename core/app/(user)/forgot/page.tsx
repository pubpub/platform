"use client";
import React, { FormEvent, useState } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";

export default function Page() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [failure, setFailure] = useState(false);

	const resetPassword = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();
		setIsLoading(true);
		setFailure(false);
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${process.env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
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
		<section className="bg-gradient-to-b from-gray-100 to-white">
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-32 pb-12 md:pt-40 md:pb-20">
					{/* Page header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
						<h1 className="h1 mb-4">Let's get you back up on your feet</h1>
						<p className="text-xl text-gray-600">
							Enter the email address you used when you signed up for your account,
							and we'll email you a secure link to reset your password.
						</p>
					</div>

					{/* Form */}
					<div className="max-w-sm mx-auto">
						<div>
							{!success && (
								<form onSubmit={resetPassword}>
									<div className="flex flex-wrap -mx-3 mb-4">
										<div className="w-full px-3">
											<label
												className="block text-gray-800 text-sm font-medium mb-1"
												htmlFor="email"
											>
												Email <span className="text-red-600">*</span>
											</label>
											<input
												className="form-input w-full text-gray-800"
												value={email}
												onChange={(evt) => setEmail(evt.target.value)}
												placeholder="example@mail.com"
											/>
										</div>
									</div>
									<div className="flex flex-wrap -mx-3 mt-6">
										<div className="w-full px-3">
											<Button
												className="btn text-white bg-black hover:bg-white hover:text-black w-full"
												variant="outline"
												type="submit"
												disabled={!email}
											>
												Send password reset email
											</Button>
										</div>
									</div>

									{failure && (
										<div className={"text-red-700 my-4"}>
											Error reseting password
										</div>
									)}
								</form>
							)}
							{success && (
								<div className="text-green-700 my-4">
									Password reset email sent! Please check your inbox.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
