"use client";

import type { Static } from "@sinclair/typebox";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { registerFormats } from "schemas";

import type { Users } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

registerFormats();

export const formSchema = Type.Object({
	firstName: Type.String(),
	lastName: Type.String(),
	email: Type.String({ format: "email" }),
	password: Type.String({
		minLength: 8,
		maxLength: 72,
	}),
});

export function BaseSignupForm(props: {
	user: Pick<Users, "firstName" | "lastName" | "email" | "id"> | null;
	onSubmit: (data: Static<typeof formSchema>) => Promise<void>;
	redirectTo?: string;
}) {
	const resolver = useMemo(() => typeboxResolver(formSchema), []);

	const form = useForm<Static<typeof formSchema>>({
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

											<Input {...field} placeholder="Max" required />
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
											<Input {...field} placeholder="Robinson" required />
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
										<Input
											{...field}
											type="email"
											placeholder="m@example.com"
											required
										/>
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
										<Input {...field} type="password" />
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full">
								Finish sign up
							</Button>
						</div>
						{/* <div className="mt-4 text-center text-sm">
							Already have an account?{" "}
							<Link href="#" className="underline">
								Sign in
							</Link>
						</div> */}
					</CardContent>
					<CardFooter>
						Or{" "}
						<Link
							href={`/login${props.redirectTo ? `?redirectTo=${props.redirectTo}` : ""}`}
							className="underline"
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
