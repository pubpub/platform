"use client";

import type { Static } from "@sinclair/typebox";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

import type { CommunitiesId, Users } from "db/public";

import { publicSignup } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";
import { BaseSignupForm, formSchema } from "./BaseSignupForm";

export function PublicSignupForm(props: {
	user: Pick<Users, "firstName" | "lastName" | "email" | "id"> | null;
	communityId: CommunitiesId;
}) {
	const runSignup = useServerAction(publicSignup);

	const searchParams = useSearchParams();

	const handleSubmit = useCallback(async (data: Static<typeof formSchema>) => {
		await runSignup({
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			password: data.password,
			redirect: searchParams.get("redirectTo"),
			communityId: props.communityId,
		});
	}, []);

	return <BaseSignupForm user={props.user} onSubmit={handleSubmit} />;
}
