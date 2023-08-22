"use client";
import React, { useState, FormEvent } from "react";
import SHA3 from "crypto-js/sha3";
import encHex from "crypto-js/enc-hex";
import Button from "components/Button";
import Input from "components/Input";
import SectionHeader from "components/SectionHeader";
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
			password: SHA3(password).toString(encHex),
		});
		if (error) {
			setIsLoading(false);
			setFailure(true);
		} else if (data) {
			window.location.href = "/";
		}
	};

	return (
		<>
			<SectionHeader text="Login" />
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<Input
						label="Email"
						value={email}
						onChange={(evt) => setEmail(evt.target.value)}
					/>
					<Input
						label="Password"
						value={password}
						type="password"
						onChange={(evt) => setPassword(evt.target.value)}
					/>

					<div className="my-6 flex space-x-8 items-center">
						<Button
							type="submit"
							text="Login"
							primary
							isLoading={isLoading}
							disabled={!email || !password}
						/>
						<Link href="/forgot" className="text-sm text-gray-600 hover:underline">
							Forgot Password
						</Link>
					</div>
					{failure && (
						<div className={"text-red-700 my-4"}>Incorrect password or email</div>
					)}
				</form>
			</div>
		</>
	);
}
