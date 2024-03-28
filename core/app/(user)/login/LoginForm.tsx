"use client";
import React, { useState, FormEvent } from "react";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { supabase } from "lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Check, Loader2 } from "ui/icon";

const loginFormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export default function LoginForm() {
	const router = useRouter();
	// const [password, setPassword] = useState("");
	// const [email, setEmail] = useState("");
	// const [isLoading, setIsLoading] = useState(false);
	// const [failure, setFailure] = useState(false);

	const form = useForm({
		resolver: zodResolver(loginFormSchema),
	});

	const handleSubmit = async () => {
		// setIsLoading(true);
		// setFailure(false);
		// evt.preventDefault();
		const { data, error } = await supabase.auth.signInWithPassword({
			email: form.getValues().email,
			password: form.getValues().password,
		});
		if (error) {
			form.setError("password", { message: "Incorrect password or email" });
		} else if (data) {
			// check if user is in a community
			const response = await fetch(`/api/member?email=${data.user.email}`, {
				method: "GET",
				headers: { "content-type": "application/json" },
			});
			const { member } = await response.json();
			router.refresh();
			if (member) {
				router.push(`/c/${member.community.slug}/stages`);
			} else {
				router.push("/settings");
			}
		}
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
							render={({ field, fieldState }) => (
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
							className="w-full"
							disabled={form.formState.isSubmitting || !form.formState.isValid}
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
				{/* <div>
						<label htmlFor="email">Email</label>
					</div>
					<div>
						<input
							id="email"
							className="w-full"
							placeholder="Enter your email address"
							name="email"
							value={email}
							onChange={(evt) => setEmail(evt.target.value)}
						/>
					</div>
					<div className="mt-2">
						<label htmlFor="password">Password</label>
					</div>
					<div>
						<input
							id="password"
							className="w-full"
							placeholder="Enter your password"
							name="password"
							value={password}
							type="password"
							onChange={(evt) => setPassword(evt.target.value)}
						/>
					</div>

					<div className="my-6 text-center">
						<Button className="mr-4" type="submit" disabled={!email || !password}>
							Login
						</Button>
						<Link href="/forgot" className="text-sm text-gray-600 hover:underline">
							Forgot Password
						</Link>
					</div>
					{failure && (
						<div className={"text-red-700 my-4"}>Incorrect password or email</div>
					)} */}
			</form>
		</Form>
	);
}
