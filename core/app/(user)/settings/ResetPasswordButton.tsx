"use client";

import { useFormStatus } from "react-dom";

import { Button } from "ui/button";
import { Loader2 } from "ui/icon";
import { toast } from "ui/use-toast";

import type { UserLoginData } from "~/lib/types";
import { sendForgotPasswordMail } from "~/lib/auth/actions";
import { useServerAction } from "~/lib/serverActions";

export const ResetPasswordButton = ({ user }: { user: UserLoginData }) => {
	const status = useFormStatus();
	const runResetPassword = useServerAction(sendForgotPasswordMail);

	const onSubmit = async () => {
		const result = await runResetPassword({ email: user.email });

		if (result && "error" in result) {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		}

		toast({
			title: "Success",
			description: "Password reset email sent! Please check your inbox.",
			duration: 5000,
		});
	};

	return (
		<form action={onSubmit}>
			<Button className="flex items-center gap-x-2">
				{status.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Reset</span>}
			</Button>
		</form>
	);
};
