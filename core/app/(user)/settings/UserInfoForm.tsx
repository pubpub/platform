"use client"

import type { UserLoginData } from "~/lib/types"

import dynamic from "next/dynamic"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "ui/button"
import { Field, FieldError, FieldLabel } from "ui/field"
import { Loader2 } from "ui/icon"
import { Input } from "ui/input"
import { Skeleton } from "ui/skeleton"
import { toast } from "ui/use-toast"

import { useServerAction } from "~/lib/serverActions"
import { AvatarEditor } from "./AvatarEditor"
import * as actions from "./actions"
import { userInfoFormSchema } from "./schema"

const _FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: make sure this is the same height as the file upload, otherwise looks ugly
		loading: () => <Skeleton className="h-[182px] w-full" />,
	}
)

export function UserInfoForm({ user }: { user: UserLoginData }) {
	const runUpdateUserInfo = useServerAction(actions.updateUserInfo)

	const runUpload = useServerAction(actions.uploadUserAvatar)
	const runUpdateAvatar = useServerAction(actions.updateUserAvatar)
	const signedUploadUrl = (fileName: string) => {
		return runUpload({ userId: user.id, fileName })
	}

	const userInfoForm = useForm<z.infer<typeof userInfoFormSchema>>({
		resolver: zodResolver(userInfoFormSchema),
		mode: "onBlur",
		defaultValues: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName ?? "",
			email: user.email,
		},
	})

	const avatarForm = useForm<{ avatar: string | null }>({
		resolver: zodResolver(
			z.object({
				avatar: z.string().url().nullable(),
			})
		),
		mode: "onBlur",
		defaultValues: {
			avatar: user.avatar,
		},
	})

	const onSubmit = async (data: z.infer<typeof userInfoFormSchema>) => {
		const result = await runUpdateUserInfo({ data })
		if (result && "success" in result) {
			toast.success("User information updated")
		}
	}
	const onSubmitAvatar = async (data: { avatar: string | null }) => {
		const result = await runUpdateAvatar({ userId: user.id, fileName: data.avatar })
		if (result && "success" in result) {
			toast.success("Avatar updated")
			return
		}

		avatarForm.resetField("avatar")
	}

	return (
		<div className="flex flex-col gap-y-8">
			<form
				onSubmit={avatarForm.handleSubmit(onSubmitAvatar)}
				className="flex flex-col gap-y-4"
				id="avatar-form"
			>
				<Controller
					control={avatarForm.control}
					name="avatar"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid} aria-label="Avatar">
							<FieldLabel htmlFor={field.name}>Avatar</FieldLabel>
							<AvatarEditor
								user={user}
								avatar={field.value}
								onEdit={async (avatar: string | null) => {
									field.onChange(avatar)
									await avatarForm.handleSubmit(onSubmitAvatar)()
								}}
								upload={signedUploadUrl}
							/>
						</Field>
					)}
				/>
			</form>
			<form onSubmit={userInfoForm.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<input type="hidden" name="id" value={user.id} />
				<Controller
					control={userInfoForm.control}
					name="firstName"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid} aria-label="First Name">
							<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
							<Input {...field} />
							<FieldError errors={[fieldState.error]} />
						</Field>
					)}
				/>
				<Controller
					control={userInfoForm.control}
					name="lastName"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid} aria-label="Last Name">
							<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
							<Input {...field} />
							<FieldError errors={[fieldState.error]} />
						</Field>
					)}
				/>
				<Controller
					control={userInfoForm.control}
					name="email"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid} aria-label="Email">
							<FieldLabel htmlFor={field.name}>Email</FieldLabel>
							<Input {...field} />
							<FieldError errors={[fieldState.error]} />
						</Field>
					)}
				/>
				<Button
					type="submit"
					disabled={
						userInfoForm.formState.isSubmitting ||
						!userInfoForm.formState.isValid ||
						!userInfoForm.formState.isDirty
					}
					className="w-min grow-0"
				>
					Save
					{userInfoForm.formState.isSubmitting && (
						<Loader2 className="h-4 w-4 animate-spin" />
					)}
				</Button>
			</form>
		</div>
	)
}
