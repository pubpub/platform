"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form"
import { Input } from "ui/input"
import { PasswordInput } from "ui/password-input"
import { FormSubmitButton } from "ui/submit-button"

import * as actions from "~/lib/authentication/actions"
import { useServerAction } from "~/lib/serverActions"

export const loginFormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

export default function LoginForm() {
	const searchParams = useSearchParams()
	const form = useForm<z.infer<typeof loginFormSchema>>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: {
			// in order to prevent "Form changed from uncontrolled to controlled" React errors
			email: "",
			password: "",
		},
	})

	const runLoginWithPassword = useServerAction(actions.loginWithPassword)

	const handleSubmit = async (formData: z.infer<typeof loginFormSchema>) => {
		const result = await runLoginWithPassword({
			email: formData.email,
			password: formData.password,
			redirectTo: searchParams.get("redirectTo") ?? null,
		})

		if (result?.error) {
			form.setError("root", { message: result.error })
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<Card className="w-full max-w-sm shadow-lg transition-shadow duration-300 hover:shadow-xl">
					<CardHeader>
						<CardTitle className="text-2xl">Login</CardTitle>
						<CardDescription>
							Enter your email below to login to your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field, fieldState }) => (
								<div className="grid gap-2">
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="name@example.com" {...field} />
										</FormControl>
									</FormItem>
								</div>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<div className="grid gap-2">
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<PasswordInput {...field} />
										</FormControl>
									</FormItem>
								</div>
							)}
						/>
					</CardContent>
					<CardFooter className="flex flex-col gap-y-4">
						<FormSubmitButton
							formState={form.formState}
							idleText="Sign in"
							pendingText="Signing in..."
							successText="Success!"
							errorText="Error signing in"
							className="w-full"
						/>
						<Link href="/forgot" className="text-gray-600 text-sm hover:underline">
							Forgot Password
						</Link>
					</CardFooter>
				</Card>
			</form>
		</Form>
	)
}
