"use client";
import React, { useState, FormEvent } from "react";
import SHA3 from "crypto-js/sha3";
import encHex from "crypto-js/enc-hex";
import Button from "components/Button";
import Input from "components/Input";
import SectionHeader from "components/SectionHeader";
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
			password: SHA3(password).toString(encHex),
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
			<SectionHeader text="Reset Password" />
			{!success && (
				<div className="my-10">
					<form onSubmit={handleSubmit}>
						<Input
							label="Password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>
						<Button
							type="submit"
							text="Set new password"
							primary
							isLoading={isLoading}
							disabled={!password}
						/>
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
