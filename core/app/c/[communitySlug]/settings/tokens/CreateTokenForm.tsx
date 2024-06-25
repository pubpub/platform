"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Stages } from "db/public/Stages";
import ApiAccessScope from "db/public/ApiAccessScope";
import { apiAccessTokensInitializerSchema } from "db/public/ApiAccessTokens";
import { stagesIdSchema } from "db/public/Stages";
import {
	ApiAccessPermissionConstraintsConfig,
	ApiAccessPermissionConstraintsInput,
} from "db/types";
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
import { PermissionField } from "./PermissionField";

export const permissionsSchema = z.object({
	[ApiAccessScope.community]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.stage]: z.object({
		read: z
			.object({
				stages: z.array(stagesIdSchema),
			})
			.or(z.boolean())
			.optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.pub]: z.object({
		read: z.boolean().optional(),
		write: z
			.object({
				stages: z.array(stagesIdSchema),
			})
			.or(z.boolean())
			.optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.member]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.pubType]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
}) satisfies z.Schema<ApiAccessPermissionConstraintsInput>;

const createTokenFormSchema = apiAccessTokensInitializerSchema
	.omit({
		communityId: true,
		usageLimit: true,
		issuedById: true,
	})
	.extend({
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

export type CreateTokenFormContext = {
	stages: Stages[];
};

export const CreateTokenForm = ({ context }: { context: CreateTokenFormContext }) => {
	const form = useForm<CreateTokenFormSchema>({
		resolver: zodResolver(createTokenFormSchema),
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
														context={context}
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

						<Button type="submit" className="justify-self-end">
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
								<span className="text-lg font-semibold">{token}</span>
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
