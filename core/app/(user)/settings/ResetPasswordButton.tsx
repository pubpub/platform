"use client";

import { useFormStatus } from "react-dom";

import { Button } from "ui/button";
import { Loader2 } from "ui/icon";
import { toast } from "ui/use-toast";

import type { UserLoginData } from "~/lib/types";
import { env } from "~/lib/env/env.mjs";
import { supabase } from "~/lib/supabase";

export const ResetPasswordButton = ({ user }: { user: UserLoginData }) => {
	const status = useFormStatus();

	const onSubmit = async () => {
		const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
		});

		if (error) {
			toast({
				title: "Error",
				description: error.message,
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
