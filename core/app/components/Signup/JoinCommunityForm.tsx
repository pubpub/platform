"use client";

import { useForm } from "react-hook-form";

import type { Communities } from "db/public";
import { MemberRole } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Form } from "ui/form";

export const JoinCommunityForm = ({
	community,
	role = MemberRole.contributor,
}: {
	community: Communities;
	role?: MemberRole;
}) => {
	const form = useForm();

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(props.onSubmit)}>
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
								Finish sign up
							</Button>
						</div>
					</CardContent>
				</Card>
			</form>
		</Form>
	);
};
