"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { CreateTokenFormContext as CreateTokenFormContextType } from "db/types";
import { ApiAccessScope, apiAccessTokensInitializerSchema } from "db/public";
import { permissionsSchema } from "db/types";
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { CopyButton } from "ui/copy-button";
import { DatePicker } from "ui/date-picker";
import { Dialog, DialogContent, DialogTitle } from "ui/dialog";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Separator } from "ui/separator";

import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";
import { CreateTokenFormContext } from "./CreateTokenFormContext";
import { PermissionField } from "./PermissionField";

export const createTokenFormSchema = apiAccessTokensInitializerSchema
	.omit({
		communityId: true,
		issuedById: true,
	})
	.extend({
		name: z.string().min(1, "Name is required").max(255, "Name is too long"),
		description: z.string().max(255).optional(),
		token: apiAccessTokensInitializerSchema.shape.token.optional(),
		expiration: z
			.date()
			.max(
				new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
				"Maximum expiration date is 1 year in the future"
			)
			.min(new Date(), "Expiry date cannot be in the past"),
		permissions: permissionsSchema,
	})
	.superRefine((data, ctx) => {
		if (
			Object.values(data.permissions)
				.flatMap((scope) => Object.values(scope))
				.filter((value) => value).length > 0
		) {
			return true;
		}
		ctx.addIssue({
			path: ["permissions"],
			code: z.ZodIssueCode.custom,

			message: "At least one permission must be selected",
		});
		return false;
	});

export type CreateTokenFormSchema = z.infer<typeof createTokenFormSchema>;
export type CreateTokenForm = ReturnType<typeof useForm<CreateTokenFormSchema>>;

export const CreateTokenForm = () => {
	const form = useForm<CreateTokenFormSchema>({
		resolver: zodResolver(createTokenFormSchema),
		defaultValues: {
			name: "",
			description: "",
			// default to 1 day from now, mostly to make testing easier
			expiration: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
	});

	const createToken = useServerAction(actions.createToken);

	const onSubmit = async (data: CreateTokenFormSchema) => {
		const result = await createToken(data);

		if ("success" in result) {
			form.setValue("token" as const, result.data.token);
		}
	};
	// this `as const` should not be necessary, not sure why it is
	const token = form.watch("token" as const);

	console.log(form.getValues());

	return (
		<Form {...form}>
			<form className="grid gap-2" onSubmit={form.handleSubmit(onSubmit)}>
				<h2 className="text-xl font-semibold">Create New Token</h2>
				<Card>
					<CardContent className="flex flex-col gap-4 gap-y-4 py-8">
						<FormField
							name="name"
							control={form.control}
							render={({ field }) => (
								<FormItem className="grid gap-2">
									<FormLabel>Token Name</FormLabel>
									<Input placeholder="Enter a name" {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="description"
							control={form.control}
							render={({ field }) => (
								<FormItem className="grid gap-2">
									<FormLabel>Description</FormLabel>
									<Input placeholder="Enter a description" {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="expiration"
							control={form.control}
							render={({ field }) => (
								<FormItem className="grid gap-2">
									<FormLabel>Expiry date</FormLabel>
									<FormDescription>
										The date when this token expires. Maximum expiration date is
										1 year in the future
									</FormDescription>
									<DatePicker
										date={field.value}
										setDate={(date) => field.onChange(date)}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="permissions"
							control={form.control}
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>Permissions</FormLabel>
										<div className="flex flex-col gap-4">
											{Object.values(ApiAccessScope).map((scope) => (
												<React.Fragment key={scope}>
													<Separator />
													<PermissionField
														key={scope}
														name={scope}
														form={form}
														prettyName={`${scope[0].toUpperCase()}${scope.slice(1)}`}
													/>
												</React.Fragment>
											))}
										</div>

										{form.formState.errors?.permissions && (
											<div className="text-sm text-red-500">
												<p>
													{
														form.formState.errors?.permissions?.root
															?.message
													}
												</p>
											</div>
										)}
									</FormItem>
								);
							}}
						/>

						<Button
							type="submit"
							className="justify-self-end"
							// disabled={!form.formState.isValid}
							data-testid="create-token-button"
						>
							Create Token
						</Button>
					</CardContent>
				</Card>
			</form>
			<Dialog open={token !== undefined} onOpenChange={(open) => !open && form.reset()}>
				{token !== undefined && (
					<DialogContent>
						<DialogTitle>Token created!</DialogTitle>
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-x-4">
								<span className="text-lg font-semibold" data-testid="token-value">
									{token}
								</span>
								<CopyButton value={token} />
							</div>
							<p>
								Be sure to save this token, as you will not be able to see it again!
							</p>
						</div>
					</DialogContent>
				)}
			</Dialog>
		</Form>
	);
};

/**
 * Exported here instead of just importing CreateTokenFormContext.tsx
 * in page.tsx, because doing so triggers the following strange error
 *
 * React.jsx: type is invalid -- expected a string (for built-in components)
 * or a class/function (for composite components) but got: undefined.
 * You likely forgot to export your component from the file it's defined in,
 * or you might have mixed up default and named imports
 */
export const CreateTokenFormWithContext = ({ stages, pubTypes }: CreateTokenFormContextType) => {
	return (
		<CreateTokenFormContext.Provider
			value={{
				stages,
				pubTypes,
			}}
		>
			<CreateTokenForm />
		</CreateTokenFormContext.Provider>
	);
};
