"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui";
import { supabase } from "lib/supabase";
import { useRouter } from "next/navigation";
import { getSlugSuffix, slugifyString } from "lib/string";
import { UserPutBody, UserSettings } from "~/lib/types";

type Props = UserSettings;

export default function SettingsForm({
	firstName: initFirstName,
	lastName: initLastName,
	email: initEmail,
	slug,
}: Props) {
	const [firstName, setFirstName] = useState(initFirstName);
	const [lastName, setLastName] = useState(initLastName);
	const [email, setEmail] = useState(initEmail);
	const [isLoading, setIsLoading] = useState(false);
	const [resetIsLoading, setResetIsLoading] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);
	const emailChanged = initEmail !== email;
	const router = useRouter();
	const valuesChanged = emailChanged || firstName !== initFirstName || lastName !== initLastName;
	const slugSuffix = getSlugSuffix(slug);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();

		setIsLoading(true);
		const putBody: UserPutBody = {
			firstName,
			lastName,
		};
		if (emailChanged) {
			const { error } = await supabase.auth.updateUser({ email });
			if (error) {
				setIsLoading(false);
				console.error(error);
				return false;
			}
		}
		const response = await fetch("/api/user", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(putBody),
		});
		const data = await response.json();
		if (data.error) {
			setIsLoading(false);
			console.error(data.error);
		} else {
			setIsLoading(false);
			router.refresh();
		}
	};
	const resetPassword = async () => {
		setResetIsLoading(true);
		const { error } = await supabase.auth.resetPasswordForEmail(initEmail, {
			redirectTo: "https://www.pubpub.org/reset",
		});
		if (error) {
			console.error(error);
		} else {
			setResetSuccess(true);
		}
		setResetIsLoading(false);
	};

	return (
		<>
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<label htmlFor="name">Name</label>
					<div className="flex flex-row">
						<input
							name="name"
							value={firstName}
							onChange={(evt) => setFirstName(evt.target.value)}
							className="mr-2"
						/>
						<input
							name="name"
							value={lastName}
							onChange={(evt) => setLastName(evt.target.value)}
						/>
					</div>
					<div className="text-gray-500 text-sm leading-tight mt-3">
						Username: {slugifyString(firstName)}-{slugifyString(lastName)}-{slugSuffix}
					</div>
					<label htmlFor="email">Email</label>
					<input
						name="email"
						value={email}
						onChange={(evt) => setEmail(evt.target.value)}
					/>
					{emailChanged && (
						<div className="text-red-700 text-sm leading-tight -mt-3">
							You will need to confirm this change by clicking a link sent to the new
							email address.
						</div>
					)}
					<Button
						className="mt-4"
						type="submit"
						disabled={!valuesChanged || !firstName || !lastName || !email}
					>
						Save Changes
					</Button>
				</form>
				<p className="my-4">
					Click below to receive an email with a secure link for reseting yor password.
				</p>
				{!resetSuccess && (
					<Button onClick={resetPassword}> Send password reset email</Button>
				)}
				{resetSuccess && (
					<div className="text-green-700">
						Password reset email sent! Please check your inbox.
					</div>
				)}
			</div>
		</>
	);
}
