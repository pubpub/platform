"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatSupabaseError, supabase } from "lib/supabase";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";

import { env } from "~/lib/env/env.mjs";

const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

export default function ForgotForm() {
	const form = useForm({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async ({ email }: z.infer<typeof forgotPasswordSchema>) => {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
		});
		if (error) {
			form.setError("email", {
				message: formatSupabaseError(error),
			});
			return;
		}
	};

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
					<FormField
						name="email"
						render={({ field }) => (
							<FormItem aria-label="Email">
								<FormLabel>Email</FormLabel>
								<Input {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button disabled={!form.formState.isDirty || form.formState.isSubmitting}>
						Send reset email
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
						<DialogDescription>Check your inbox for a reset link.</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	);
}

// "use client";

// import React, { FormEvent, useState } from "react";

// import { supabase } from "lib/supabase";
// import { logger } from "logger";
// import { Button } from "ui/button";
// import { Loader2 } from "ui/icon";

// import { env } from "~/lib/env/env.mjs";

// export default function ForgotForm() {
// 	const [email, setEmail] = useState("");
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [success, setSuccess] = useState(false);
// 	const [failure, setFailure] = useState(false);

// 	const resetPassword = async (evt: FormEvent<EventTarget>) => {
// 		evt.preventDefault();
// 		setIsLoading(true);
// 		setFailure(false);
// 		const { error } = await supabase.auth.resetPasswordForEmail(email, {
// 			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
// 		});
// 		if (error) {
// 			logger.error(error);
// 			setFailure(true);
// 		} else {
// 			setSuccess(true);
// 		}
// 		setIsLoading(false);
// 	};

// 	return (
// 		<div className="border p-4">
// 			{!success && (
// 				<>
// 					<p className="my-4">
// 						Enter your email below to receive a secure link for reseting yor password.
// 					</p>
// 					<div className="text-center">
// 						<form
// 							onSubmit={resetPassword}
// 							className="flex items-center justify-between"
// 						>
// 							<input
// 								className="mr-4 w-1/2"
// 								value={email}
// 								onChange={(evt) => setEmail(evt.target.value)}
// 								placeholder="example@mail.com"
// 							/>

// 							<Button variant="outline" type="submit" disabled={!email || isLoading}>
// 								Send password reset email
// 								{isLoading && <Loader2 className="ml-4 h-4 w-4 animate-spin" />}
// 							</Button>

// 							{failure && (
// 								<div className={"my-4 text-red-700"}>Error reseting password</div>
// 							)}
// 						</form>
// 					</div>
// 				</>
// 			)}
// 			{success && (
// 				<div className="my-4 text-green-700">
// 					Password reset email sent! Please check your inbox.
// 				</div>
// 			)}
// 		</div>
// 	);
// }
