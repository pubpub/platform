"use client"

import type { UsersId } from "db/public"
import type { ClientExceptionOptions } from "~/lib/serverActions"
import type { SignupFormSchema } from "./schema"

import { useCallback, useMemo } from "react"
import Link from "next/link"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { useForm } from "react-hook-form"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form"
import { Input } from "ui/input"
import { FormSubmitButton } from "ui/submit-button"

import { AvatarEditor } from "~/app/(user)/settings/AvatarEditor"
import { uploadTempAvatar } from "~/app/login/actions"
import { useServerAction } from "~/lib/serverActions"
import { compiledSignupFormSchema } from "./schema"

type SignupAction = (input: {
	id?: UsersId
	firstName: string
	lastName: string
	email: string
	password: string
	avatar?: string | null
	redirectTo?: string
	slug?: string
}) => Promise<
	| {
			success: boolean
			report?: string
	  }
	| ClientExceptionOptions
>

export function SignupForm(props: {
	signupAction: SignupAction
	redirectTo?: string
	defaultValues?: Partial<SignupFormSchema>
	mustUseSameEmail?: boolean
}) {
	const resolver = useMemo(() => typeboxResolver(compiledSignupFormSchema), [])

	const form = useForm<SignupFormSchema>({
		resolver,
		defaultValues: props.defaultValues,
	})

	const runSignup = useServerAction(props.signupAction)
	const runUpload = useServerAction(uploadTempAvatar)

	const signedUploadUrl = (fileName: string) => {
		return runUpload({ fileName })
	}

	const firstName = form.watch("firstName")
	const lastName = form.watch("lastName")

	const userInitials = useMemo(() => {
		return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U"
	}, [firstName, lastName])

	const handleSubmit = useCallback(
		async (data: SignupFormSchema) => {
			const _result = await runSignup({
				...data,
				redirectTo: props.redirectTo,
			})
		},
		[runSignup, props.redirectTo]
	)

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<Card className="mx-auto max-w-sm">
					<CardHeader>
						<CardTitle className="text-xl">
							<h3>Sign Up</h3>
						</CardTitle>
						<CardDescription>
							Enter your information to finish setting up your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<FormField
								name="avatar"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Avatar (optional)</FormLabel>
										<FormControl>
											<AvatarEditor
												initials={userInitials}
												avatar={field.value ?? null}
												onEdit={field.onChange}
												upload={signedUploadUrl}
												label="Your Avatar"
												showDeleteButton={false}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									name="firstName"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>First name</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Max" required />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="lastName"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last name</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Robinson" required />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								name="email"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormDescription>
											{props.mustUseSameEmail
												? "You must enter the same email you were invited with."
												: "If you change this, we will ask you to confirm your email again."}
										</FormDescription>
										<FormControl>
											<Input
												{...field}
												type="email"
												placeholder="mail@example.com"
												required
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="password"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input {...field} type="password" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormSubmitButton
								data-testid="signup-submit-button"
								className="w-full"
								idleText="Finish sign up"
								formState={form.formState}
							/>
						</div>
					</CardContent>
					<CardFooter>
						Or{" "}
						<Link
							href={`/login${props.redirectTo ? `?redirectTo=${props.redirectTo}` : ""}`}
							className="mx-1 font-semibold underline"
						>
							sign in
						</Link>{" "}
						if you already have an account
					</CardFooter>
				</Card>
			</form>
		</Form>
	)
}
