"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";

import * as actions from "~/lib/authentication/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";

const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

export default function ForgotForm() {
	const form = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			// in order to prevent "Form changed from uncontrolled to controlled" React errors
			email: "",
		},
	});

	const sendForgotPasswordMail = useServerAction(actions.sendForgotPasswordMail);

	const [sent, setSent] = useState(false);

	const onSubmit = async ({ email }: z.infer<typeof forgotPasswordSchema>) => {
		const result = await sendForgotPasswordMail({ email });

		if (didSucceed(result)) {
			setSent(true);
			return;
		}

		form.setError("email", {
			message: result.error,
		});
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

					<Button
						type="submit"
						disabled={!form.formState.isDirty || form.formState.isSubmitting}
					>
						Send reset email
						{form.formState.isSubmitting && (
							<Loader2 className="ml-4 h-4 w-4 animate-spin" />
						)}
					</Button>
				</form>
			</Form>

			<Dialog
				open={sent}
				onOpenChange={(open) => {
					if (open) {
						return;
					}

					form.reset();
					setSent(false);
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
