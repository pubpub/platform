"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { Communities } from "db/public";
import { MemberRole } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Form } from "ui/form";

import { publicJoinCommunity } from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";

export const JoinCommunityForm = ({
	community,
	role = MemberRole.contributor,
	redirectTo,
}: {
	community: Communities;
	role?: MemberRole;
	redirectTo?: string;
}) => {
	const form = useForm();
	const runJoin = useServerAction(publicJoinCommunity);
	const router = useRouter();

	const onSubmit = useCallback(async () => {
		await runJoin();
		router.push(redirectTo ?? `/c/${community.slug}`);
	}, [redirectTo, runJoin]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card className="mx-auto max-w-sm">
					<CardHeader>
						<CardTitle className="text-xl">Join {community.name}</CardTitle>
						<CardDescription>
							Join {community.name} as a {role}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<Button type="submit" className="w-full">
								Join {community.name}
							</Button>
						</div>
					</CardContent>
				</Card>
			</form>
		</Form>
	);
};
