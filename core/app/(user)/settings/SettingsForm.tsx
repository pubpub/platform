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
	const [emailError, setEmailError] = useState("");
	const [emailIsLoading, setEmailIsLoading] = useState(false);
	const [emailSuccess, setEmailSuccess] = useState(false);
	const [, setIsLoading] = useState(false);
	const [, setResetIsLoading] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);
	const emailChanged = initEmail !== email;
	const router = useRouter();
	const valuesChanged = emailChanged || firstName !== initFirstName || lastName !== initLastName;
	const slugSuffix = getSlugSuffix(slug);

	const updateEmail = async (e: FormEvent<EventTarget>) => {
		e.preventDefault();
		setEmailError("");
		if (emailChanged) {
			setEmailIsLoading(true);
			const response = await fetch("/api/user?email=" + email, {
				method: "GET",
				headers: { "content-type": "application/json" },
			});
			const genericError = () =>
				setEmailError("An error happened while trying to update your email");

			if (!response.ok) {
				if (response.status === 403) {
					setEmailError(`A PubPub account already exists for ${email}`);
				} else {
					genericError();
					const { message }: { message?: string } = await response.json();
					console.error(`Error: ${response.status} ${message}`);
				}
				setEmailIsLoading(false);
				return;
			}

			const { error } = await supabase.auth.updateUser({ email });
			setEmailIsLoading(false);
			if (error) {
				genericError();
				console.error(error);
			}
			setEmailSuccess(true);
		}
	};

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();

		setIsLoading(true);
		let putBody: UserPutBody = {
			firstName,
			lastName,
		};
		const response = await fetch("/api/user", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(putBody),
		});
		const data = await response.json();
		setIsLoading(false);
		if (!response.ok) {
			if (data.message) {
				console.error(data.message);
			}
		} else {
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
					<div className="flex flex-row">
						<label htmlFor="firstName">First Name</label>
						<input
							name="firstName"
							value={firstName}
							onChange={(evt) => setFirstName(evt.target.value)}
							className="mr-2"
						/>
						<label htmlFor="lastName">Last Name</label>
						<input
							name="lastName"
							value={lastName ?? ""}
							onChange={(evt) => setLastName(evt.target.value)}
						/>
					</div>
					<div className="text-gray-500 text-sm leading-tight mt-3">
						Username: {slugifyString(firstName)}
						{lastName ? `-${slugifyString(lastName)}` : ""}-{slugSuffix}
					</div>
					<Button className="mt-4" type="submit" disabled={!valuesChanged || !firstName}>
						Save Changes
					</Button>
				</form>
				<form className="my-2" onSubmit={updateEmail}>
					<label htmlFor="email">Email</label>
					<input
						className="mx-2"
						name="email"
						value={email}
						onChange={(evt) => setEmail(evt.target.value)}
					/>
					<Button
						type="submit"
						disabled={!email || !emailChanged || emailSuccess || !firstName}
					>
						Update Email
					</Button>
					{!emailIsLoading &&
						(emailError ? (
							<div className="text-red-700 text-sm leading-tight">{emailError}</div>
						) : (
							emailSuccess && (
								<div className="text-red-700 text-sm leading-tight">
									You will need to confirm this change by clicking a link sent to
									the new email address.
								</div>
							)
						))}
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
