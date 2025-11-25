"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Loader2 } from "ui/icon"
import { Input } from "ui/input"

import { resetPassword } from "~/lib/authentication/actions"
import { useServerAction } from "~/lib/serverActions"

const resetPasswordSchema = z.object({
	password: z.string().min(8),
})

export default function ResetForm() {
	const router = useRouter()
	const form = useForm<z.infer<typeof resetPasswordSchema>>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			// in order to prevent "Form changed from uncontrolled to controlled" React errors
			password: "",
		},
	})
	const runResetPassword = useServerAction(resetPassword)

	const redirectUser = async () => {
		router.push("/login")
	}

	const onSubmit = async ({ password }: z.infer<typeof resetPasswordSchema>) => {
		const result = await runResetPassword({ password })

		if (result && "error" in result) {
			const formattedError = result.error
			form.setError("password", {
				message: formattedError,
			})
			return
		}

		redirectUser()
	}

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
					<FormField
						name="password"
						render={({ field }) => (
							<FormItem aria-label="Password">
								<FormLabel>New Password</FormLabel>
								<Input {...field} type="password" />
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						disabled={!form.formState.isDirty || form.formState.isSubmitting}
					>
						Set new password
						{form.formState.isSubmitting && (
							<Loader2 className="ml-4 h-4 w-4 animate-spin" />
						)}
					</Button>
				</form>
			</Form>

			<Dialog
				open={form.formState.isSubmitSuccessful}
				onOpenChange={(open) => {
					if (open) {
						return
					}

					form.reset()
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Success</DialogTitle>
						<DialogDescription className="flex flex-col gap-2">
							<span className="text-green-700">Success - password reset!</span>
							Redirecting in 5 seconds...
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	)
}
