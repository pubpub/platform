"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useForm } from "react-hook-form";
import { registerFormats } from "schemas";

import type { Users } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";

import type { SignupFormSchema } from "./schema";
import { FormSubmitButton } from "../SubmitButton";
import { compiledSignupFormSchema } from "./schema";

export function BaseSignupForm(props: {
	user: Pick<Users, "firstName" | "lastName" | "email" | "id"> | null;
	onSubmit: (data: SignupFormSchema) => Promise<void>;
	redirectTo?: string;
}) {
	const searchParams = useSearchParams();

	const redirectTo = props.redirectTo ?? searchParams.get("redirectTo");

	const resolver = useMemo(() => typeboxResolver(compiledSignupFormSchema), []);

	const form = useForm<SignupFormSchema>({
		resolver,
		defaultValues: { ...(props?.user ?? {}), lastName: props.user?.lastName ?? undefined },
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(props.onSubmit)}>
				<Card className="mx-auto max-w-sm">
					<CardHeader>
						<CardTitle className="text-xl">Sign Up</CardTitle>
						<CardDescription>
							Enter your information to finish setting up your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
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
											If you change this, we will ask you to confirm your
											email again.
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
								formState={form.formState}
								className="w-full"
								idleText="Finish sign up"
							/>
						</div>
					</CardContent>
					<CardFooter>
						Or{" "}
						<Link
							href={`/login${redirectTo ? `?redirectTo=${redirectTo}` : ""}`}
							className="mx-1 font-semibold underline"
						>
							sign in
						</Link>{" "}
						if you already have an account
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
