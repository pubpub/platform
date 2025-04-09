"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

import type { CommunitiesId } from "db/public";

import type { SignupFormSchema } from "./schema";
import { publicSignup } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";
import { BaseSignupForm } from "./BaseSignupForm";

export function PublicSignupForm(props: { communityId: CommunitiesId; redirectTo?: `/${string}` }) {
	const runSignup = useServerAction(publicSignup);

	const searchParams = useSearchParams();
	const redirectTo = props.redirectTo ?? searchParams.get("redirectTo") ?? undefined;

	const handleSubmit = useCallback(
		async (data: SignupFormSchema) => {
			// TODO: this is not very nice UX, we should wait a sec and show a loading state
			await runSignup({
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				password: data.password,
				redirectTo,
				communityId: props.communityId,
			});
		},
		[redirectTo, runSignup]
	);

	return <BaseSignupForm user={null} onSubmit={handleSubmit} redirectTo={redirectTo} />;
}
