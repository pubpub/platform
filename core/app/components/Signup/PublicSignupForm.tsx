"use client";

import type { Static } from "@sinclair/typebox";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

import type { CommunitiesId } from "db/public";
import { toast } from "ui/use-toast";

import type { SignupFormSchema } from "./schema";
import { publicSignup } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";
import { BaseSignupForm } from "./BaseSignupForm";

export function PublicSignupForm(props: { communityId: CommunitiesId }) {
	const runSignup = useServerAction(publicSignup);

	const searchParams = useSearchParams();

	const handleSubmit = useCallback(async (data: SignupFormSchema) => {
		// TODO: this is not very nice UX
		await runSignup({
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			password: data.password,
			redirect: searchParams.get("redirectTo"),
			communityId: props.communityId,
		});
	}, []);

	return <BaseSignupForm user={null} onSubmit={handleSubmit} />;
}
