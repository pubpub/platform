"use client"

import type { Communities } from "db/public"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"

import { MemberRole } from "db/public"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card"
import { Form } from "ui/form"
import { FormSubmitButton } from "ui/submit-button"
import { toast } from "ui/use-toast"

import { publicJoinCommunity } from "~/lib/authentication/actions"
import { useServerAction } from "~/lib/serverActions"

export const JoinCommunityForm = ({
	community,
	role = MemberRole.contributor,
	redirectTo,
}: {
	community: Communities
	role?: MemberRole
	redirectTo?: string
}) => {
	const form = useForm()
	const runJoin = useServerAction(publicJoinCommunity)
	const router = useRouter()
	const searchParams = useSearchParams()

	const redirectPath = redirectTo ?? searchParams.get("redirectTo") ?? `/c/${community.slug}`

	const onSubmit = useCallback(async () => {
		const result = await runJoin()
		if ("success" in result) {
			toast.success("Success", {
				description: result.report,
			})
			router.push(redirectPath)
		}
	}, [redirectPath, runJoin, router.push])

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card className="mx-auto max-w-sm">
					<CardHeader>
						<CardTitle className="text-xl">
							<h3>Join {community.name}</h3>
						</CardTitle>
						<CardDescription>
							Join {community.name} as a {role}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<FormSubmitButton
								formState={form.formState}
								className="w-full"
								idleText={`Join ${community.name}`}
							/>
						</div>
					</CardContent>
				</Card>
			</form>
		</Form>
	)
}
