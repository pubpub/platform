"use client"

import type { CreateTokenFormContext as CreateTokenFormContextType } from "db/types"
import type { CreateTokenFormSchema } from "./types"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bell } from "lucide-react"
import { useForm } from "react-hook-form"

import { ApiAccessScope } from "db/public"
import { Alert, AlertDescription, AlertTitle } from "ui/alert"
import { CopyButton } from "ui/copy-button"
import { DatePicker } from "ui/date-picker"
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"
import { Separator } from "ui/separator"
import { FormSubmitButton } from "ui/submit-button"
import { cn } from "utils"

import { useServerAction } from "~/lib/serverActions"
import * as actions from "./actions"
import { CreateTokenFormContext } from "./CreateTokenFormContext"
import { PermissionField } from "./PermissionField"
import { createTokenFormSchema } from "./types"

export type CreateTokenFormProps = {
	onSuccess?: (token: string) => void
}

export const CreateTokenForm = ({ onSuccess }: CreateTokenFormProps) => {
	const form = useForm<CreateTokenFormSchema>({
		resolver: zodResolver(createTokenFormSchema),
		defaultValues: {
			name: "",
			description: "",
			// default to 1 day from now, mostly to make testing easier
			expiration: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
	})

	const createToken = useServerAction(actions.createToken)

	const onSubmit = async (data: CreateTokenFormSchema) => {
		const result = await createToken(data)

		if ("success" in result) {
			form.setValue("token" as const, result.data.token)
			onSuccess?.(result.data.token)
			return
		}

		form.setError("root", { message: result.error })
	}
	// this `as const` should not be necessary, not sure why it is
	const token = form.watch("token")

	if (token) {
		return (
			<Alert variant="default" className={cn("mt-4 w-full min-w-96 bg-emerald-50")}>
				<Bell className="h-4 w-4 text-emerald-400" />
				<AlertTitle className={cn("font-semibold leading-normal tracking-normal")}>
					Make sure to copy this token now as you will not be able to see it again!
				</AlertTitle>
				<AlertDescription className="mt-4">
					<div className="flex w-full items-center justify-between rounded-md border bg-gray-50 p-1 pl-4 text-muted-foreground">
						<span
							className="overflow-x-auto whitespace-nowrap font-mono"
							data-testid="token-value"
						>
							{token}
						</span>
						<CopyButton value={token} className="border-l px-4" />
					</div>
				</AlertDescription>
			</Alert>
		)
	}

	return (
		<Form {...form}>
			<form
				className="flex flex-col gap-4 gap-y-4 py-8"
				onSubmit={form.handleSubmit(onSubmit)}
			>
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
								The date when this token expires. Maximum expiration date is 1 year
								in the future
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
										<p>{form.formState.errors?.permissions?.root?.message}</p>
									</div>
								)}
							</FormItem>
						)
					}}
				/>
				{form.formState.errors?.root && (
					<p className="text-sm text-red-500">{form.formState.errors?.root?.message}</p>
				)}

				<FormSubmitButton
					type="submit"
					formState={form.formState}
					disabled={!form.formState.isValid}
					data-testid="create-token-button"
					idleText="Create Token"
				/>
			</form>
		</Form>
	)
}

/**
 * Exported here instead of just importing CreateTokenFormContext.tsx
 * in page.tsx, because doing so triggers the following strange error
 *
 * React.jsx: type is invalid -- expected a string (for built-in components)
 * or a class/function (for composite components) but got: undefined.
 * You likely forgot to export your component from the file it's defined in,
 * or you might have mixed up default and named imports
 */
export const CreateTokenFormWithContext = ({
	stages,
	pubTypes,
	onSuccess,
}: CreateTokenFormContextType & { onSuccess?: (token: string) => void }) => {
	return (
		<CreateTokenFormContext.Provider
			value={{
				stages,
				pubTypes,
			}}
		>
			<CreateTokenForm onSuccess={onSuccess} />
		</CreateTokenFormContext.Provider>
	)
}
