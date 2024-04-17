"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserResponse } from "@supabase/supabase-js";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatSupabaseError, supabase } from "lib/supabase";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";

const resetPasswordSchema = z.object({
	password: z.string().min(8),
});

export default function ResetForm() {
	const router = useRouter();
	const form = useForm({
		resolver: zodResolver(resetPasswordSchema),
	});

	const redirectUser = async (data: (UserResponse & { error: null })["data"]) => {
		router.refresh();
		// check if user is in a community
		const response = await fetch(`/api/member?email=${data.user.email}`, {
			method: "GET",
			headers: { "content-type": "application/json" },
		});
		const { member } = await response.json();
		setTimeout(() => {
			if (member) {
				router.push(`/c/${member.community.slug}/stages`);
			} else {
				router.push("/settings");
			}
		}, 5000);
	};

	const onSubmit = async ({ password }: z.infer<typeof resetPasswordSchema>) => {
		const { data, error } = await supabase.auth.updateUser({
			password,
		});

		if (error) {
			const formattedError =
				error.name === "AuthSessionMissingError"
					? "This reset link is invalid or has expired. Please request a new one."
					: formatSupabaseError(error);

			form.setError("password", {
				message: formattedError,
			});
			return;
		}

		redirectUser(data);
	};

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
					<FormField
						name="password"
						render={({ field }) => (
							<FormItem aria-label="Password">
								<FormLabel>New Password</FormLabel>
								<Input {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						disabled={!form.formState.isDirty || form.formState.isSubmitting}
					>
						Set new password
						{form.formState.isSubmitting && (
							<Loader2 className="ml-4 h-4 w-4 animate-spin" />
						)}
					</Button>
				</form>
			</Form>

			<Dialog
				open={form.formState.isSubmitSuccessful}
				onOpenChange={(open) => {
					if (open) {
						return;
					}

					form.reset();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Success</DialogTitle>
						<DialogDescription>
							<p className="flex flex-col gap-2">
								<span className="text-green-700">Success - password reset!</span>
								Redirecting in 5 seconds...
							</p>
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	);
}
