"use client"

import type { z } from "zod"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"
import { PasswordInput } from "ui/password-input"
import { FormSubmitButton } from "ui/submit-button"

import { initializeSetup } from "~/lib/authentication/actions"
import { setupSchema } from "~/lib/authentication/schemas"
import { useServerAction } from "~/lib/serverActions"
import { slugifyString } from "~/lib/string"

export default function SetupForm() {
	const form = useForm<z.infer<typeof setupSchema>>({
		resolver: zodResolver(setupSchema),
		defaultValues: {
			email: "",
			password: "",
			firstName: "",
			lastName: "",
			communityName: "",
			communitySlug: "",
			communityAvatar: "",
		},
	})

	const runInitializeSetup = useServerAction(initializeSetup)

	const handleSubmit = async (formData: z.infer<typeof setupSchema>) => {
		const result = await runInitializeSetup(formData)

		if (result?.error) {
			form.setError("root", { message: result.error })
		}
	}

	const watchCommunityName = form.watch("communityName")

	useEffect(() => {
		if (watchCommunityName) {
			form.setValue("communitySlug", slugifyString(watchCommunityName))
		}
	}, [watchCommunityName, form.setValue])

	return (
		<Form {...form}>
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
							<h3 className="text-lg font-semibold">Admin Account</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input placeholder="John" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input placeholder="Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="admin@example.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<PasswordInput {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-4">
							<h3 className="text-lg font-semibold">First Community</h3>
							<FormField
								control={form.control}
								name="communityName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Community Name</FormLabel>
										<FormControl>
											<Input placeholder="My Organization" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="communitySlug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Community Slug</FormLabel>
										<FormControl>
											<Input placeholder="my-organization" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="communityAvatar"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Community Avatar URL (optional)</FormLabel>
										<FormControl>
											<Input
												placeholder="https://example.com/avatar.png"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{form.formState.errors.root && (
							<div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
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
		</Form>
	)
}
