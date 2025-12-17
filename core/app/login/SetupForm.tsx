"use client"

import type { z } from "zod"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card"
import { Field, FieldError, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { PasswordInput } from "ui/password-input"
import { FormSubmitButton } from "ui/submit-button"

import { AvatarEditor } from "~/app/(user)/settings/AvatarEditor"
import { initializeSetup } from "~/lib/authentication/actions"
import { setupSchema } from "~/lib/authentication/schemas"
import { useServerAction } from "~/lib/serverActions"
import { slugifyString } from "~/lib/string"
import { uploadTempAvatar } from "./actions"

export default function SetupForm() {
	const form = useForm<z.infer<typeof setupSchema>>({
		resolver: zodResolver(setupSchema),
		defaultValues: {
			email: "",
			password: "",
			firstName: "",
			lastName: "",
			userAvatar: null,
			communityName: "",
			communitySlug: "",
			communityAvatar: null,
		},
	})

	const runInitializeSetup = useServerAction(initializeSetup)
	const runUpload = useServerAction(uploadTempAvatar)

	const signedUploadUrl = (fileName: string) => {
		return runUpload({ fileName })
	}

	const handleSubmit = async (formData: z.infer<typeof setupSchema>) => {
		const result = await runInitializeSetup(formData)

		if (result?.error) {
			form.setError("root", { message: result.error })
		}
	}

	const watchCommunityName = form.watch("communityName")
	const watchFirstName = form.watch("firstName")
	const watchLastName = form.watch("lastName")

	useEffect(() => {
		if (watchCommunityName) {
			form.setValue("communitySlug", slugifyString(watchCommunityName))
		}
	}, [watchCommunityName, form.setValue])

	const userInitials = useMemo(() => {
		return `${watchFirstName?.[0] ?? ""}${watchLastName?.[0] ?? ""}`.toUpperCase() || "U"
	}, [watchFirstName, watchLastName])

	const communityInitials = useMemo(() => {
		return (
			watchCommunityName
				.split(" ")
				.slice(0, 2)
				.map((word) => word[0])
				.join("")
				.toUpperCase() || "C"
		)
	}, [watchCommunityName])

	return (
		<form onSubmit={form.handleSubmit(handleSubmit)}>
			<Card className="w-full max-w-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl">
				<CardHeader>
					<CardTitle className="text-2xl">Initial Setup</CardTitle>
					<CardDescription>
						Create the first admin account and your first community. You can create
						additional communities later at /communities.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6">
					<div className="space-y-4">
						<h3 className="font-semibold text-lg">Admin Account</h3>
						<Controller
							control={form.control}
							name="userAvatar"
							render={({ field }) => (
								<AvatarEditor
									initials={userInitials}
									avatar={field.value ?? null}
									onEdit={field.onChange}
									upload={signedUploadUrl}
									label="Admin Avatar"
									showDeleteButton={false}
								/>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<Controller
								control={form.control}
								name="firstName"
								render={({ field, fieldState }) => (
									<Field
										data-invalid={fieldState.invalid}
										aria-label="First Name"
									>
										<FieldLabel>First Name</FieldLabel>
										<Input placeholder="John" {...field} />
										<FieldError errors={[fieldState.error]} />
									</Field>
								)}
							/>
							<Controller
								control={form.control}
								name="lastName"
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid} aria-label="Last Name">
										<FieldLabel>Last Name</FieldLabel>
										<Input placeholder="Doe" {...field} />
										<FieldError errors={[fieldState.error]} />
									</Field>
								)}
							/>
						</div>
						<Controller
							control={form.control}
							name="email"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid} aria-label="Email">
									<FieldLabel>Email</FieldLabel>
									<Input placeholder="admin@example.com" {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
						<Controller
							control={form.control}
							name="password"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid} aria-label="Password">
									<FieldLabel>Password</FieldLabel>
									<PasswordInput {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-lg">First Community</h3>
						<Controller
							control={form.control}
							name="communityAvatar"
							render={({ field }) => (
								<AvatarEditor
									initials={communityInitials}
									avatar={field.value ?? null}
									onEdit={field.onChange}
									upload={signedUploadUrl}
									label="Community Avatar"
									showDeleteButton={false}
								/>
							)}
						/>
						<Controller
							control={form.control}
							name="communityName"
							render={({ field, fieldState }) => (
								<Field
									data-invalid={fieldState.invalid}
									aria-label="Community Name"
								>
									<FieldLabel>Community Name</FieldLabel>
									<Input placeholder="My Organization" {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
						<Controller
							control={form.control}
							name="communitySlug"
							render={({ field, fieldState }) => (
								<Field
									data-invalid={fieldState.invalid}
									aria-label="Community Slug"
								>
									<FieldLabel>Community Slug</FieldLabel>
									<Input placeholder="my-organization" {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
					</div>

					{form.formState.errors.root && (
						<div className="rounded-md bg-red-50 p-3 text-red-800 text-sm">
							{form.formState.errors.root.message}
						</div>
					)}
				</CardContent>
				<CardFooter>
					<FormSubmitButton
						formState={form.formState}
						idleText="Complete Setup"
						pendingText="Setting up..."
						successText="Success!"
						errorText="Error during setup"
						className="w-full"
					/>
				</CardFooter>
			</Card>
		</form>
	)
}
