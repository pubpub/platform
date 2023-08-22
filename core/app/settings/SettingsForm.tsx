"use client";
import React, { useState, FormEvent } from "react";
import Button from "components/Button";
import { UserPutBody } from "pages/api/user";
import Input from "components/Input";
import SectionHeader from "components/SectionHeader";
import AvatarSelector from "components/AvatarSelector";
import { supabase } from "lib/supabase";
import { useRouter } from "next/navigation";
import { getSlugSuffix, slugifyString } from "lib/string";
type Props = {
	name: string;
	email: string;
	slug: string;
};

export default function SettingsForm({ name: initName, email: initEmail, slug }: Props) {
	const [name, setName] = useState(initName);
	const [email, setEmail] = useState(initEmail);
	const [isLoading, setIsLoading] = useState(false);
	const [resetIsLoading, setResetIsLoading] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);
	const emailChanged = initEmail !== email;
	const router = useRouter();
	const valuesChanged = emailChanged || name !== initName || avatarColor !== initAvatarColor;
	const slugSuffix = getSlugSuffix(slug);

	const handleSubmit = async (evt: FormEvent<EventTarget>) => {
		evt.preventDefault();

		setIsLoading(true);
		const putBody: UserPutBody = {
			name,
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
			<SectionHeader text="User Details" />
			<div className="my-10">
				<form onSubmit={handleSubmit}>
					<Input
						label="Name"
						value={name}
						onChange={(evt) => setName(evt.target.value)}
					/>
					<div className="text-gray-500 text-sm leading-tight -mt-3">
						Username: {slugifyString(name)}-{slugSuffix}
					</div>
					<Input
						label="Email"
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
						text="Save Changes"
						primary
						isLoading={isLoading}
						disabled={!valuesChanged || !name || !email}
					/>
				</form>
				<SectionHeader
					className="mt-12 pt-12 border-t border-t-stone-400"
					text="Reset Password"
				/>
				<p className="my-4">
					Click below to receive an email with a secure link for reseting yor password.
				</p>
				{!resetSuccess && (
					<Button
						onClick={resetPassword}
						text={"Send password reset email"}
						isLoading={resetIsLoading}
					/>
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
