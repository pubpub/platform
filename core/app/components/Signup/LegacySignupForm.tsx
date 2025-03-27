"use client";

import type { Static } from "@sinclair/typebox";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

import type { Users } from "db/public";

import type { SignupFormSchema } from "./schema";
import { legacySignup } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";
import { BaseSignupForm } from "./BaseSignupForm";

export function LegacySignupForm(props: {
	user: Pick<Users, "firstName" | "lastName" | "email" | "id">;
}) {
	const signup = useServerAction(legacySignup);
	const searchParams = useSearchParams();
	const onSubmit = useCallback(async (data: SignupFormSchema) => {
		await signup({
			id: props.user.id,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			password: data.password,
			redirect: searchParams.get("redirectTo"),
		});
	}, []);

	return <BaseSignupForm user={props.user} onSubmit={onSubmit} />;
}
