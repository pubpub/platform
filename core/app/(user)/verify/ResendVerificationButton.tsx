"use client";

import { useState } from "react";

import type { ButtonState } from "~/app/components/SubmitButton";
import { SubmitButton } from "~/app/components/SubmitButton";
import { sendVerifyEmailMail } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";

export const ResendVerificationButton = ({
	email,
	redirectTo,
}: {
	email: string;
	redirectTo?: string;
}) => {
	const [status, setStatus] = useState<ButtonState>("idle");
	const sendVerifyEmail = useServerAction(sendVerifyEmailMail);

	const handleResend = async () => {
		setStatus("pending");
		const result = await sendVerifyEmail({ email, redirectTo });
		if ("error" in result) {
			setStatus("error");
		} else {
			setStatus("success");
		}
	};

	return (
		<SubmitButton
			state={status}
			onClick={handleResend}
			idleText="Resend verification email"
			pendingText="Sending..."
		/>
	);
};
