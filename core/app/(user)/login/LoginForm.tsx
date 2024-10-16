"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Check, Loader2 } from "ui/icon";
import { Input } from "ui/input";

import * as actions from "~/lib/auth/actions";
import { useServerAction } from "~/lib/serverActions";

export const loginFormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export default function LoginForm() {
	const searchParams = useSearchParams();
	const form = useForm<z.infer<typeof loginFormSchema>>({
		resolver: zodResolver(loginFormSchema),
	});

	const runLoginWithPassword = useServerAction(actions.loginWithPassword);

	const handleSubmit = async (formData: z.infer<typeof loginFormSchema>) => {
		await runLoginWithPassword({
			email: formData.email,
			password: formData.password,
			redirectTo: searchParams.get("redirectTo") ?? null,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<Card className="w-full max-w-sm">
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
											<Input placeholder="m@example.com" {...field} />
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
											<Input type="password" {...field} />
										</FormControl>
									</FormItem>
								</div>
							)}
						/>
					</CardContent>
					<CardFooter className="flex flex-col gap-y-4">
						<Button
							className="flex w-full items-center gap-x-2"
							disabled={form.formState.isSubmitting || !form.formState.isValid}
							type="submit"
						>
							{form.formState.isSubmitting ? (
								<Loader2 className="animate-spin" />
							) : form.formState.isSubmitSuccessful ? (
								<>
									<Check className="h-4 w-4" />
									<span>Success</span>
								</>
							) : (
								"Sign in"
							)}
						</Button>
						<Link href="/forgot" className="text-sm text-gray-600 hover:underline">
							Forgot Password
						</Link>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
