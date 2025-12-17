"use client"

import type { Communities, CommunitiesId } from "db/public"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
	AlertTriangle,
	ArrowRight,
	Bot,
	CurlyBraces,
	Info,
	Layers3,
	Loader2,
	ToyBrick,
	Trash2,
	UsersRound,
} from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ui/alert-dialog"
import { Button } from "ui/button"
import { Field, FieldError, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"
import { toast } from "ui/use-toast"

import { AvatarEditor } from "~/app/(user)/settings/AvatarEditor"
import { useServerAction } from "~/lib/serverActions"
import * as actions from "./actions"
import { communitySettingsSchema } from "./schema"

export function CommunitySettingsForm({
	community,
	communitySlug,
}: {
	community: Communities
	communitySlug: string
}) {
	const router = useRouter()
	const runUpdateCommunity = useServerAction(actions.updateCommunitySettings)
	const runUpload = useServerAction(actions.uploadCommunityAvatar)
	const runUpdateAvatar = useServerAction(actions.updateCommunityAvatar)
	const runDeleteCommunity = useServerAction(actions.deleteCommunity)

	const signedUploadUrl = (fileName: string) => {
		return runUpload({ communityId: community.id as CommunitiesId, fileName })
	}

	const communityForm = useForm<z.infer<typeof communitySettingsSchema>>({
		resolver: zodResolver(communitySettingsSchema),
		mode: "onBlur",
		defaultValues: {
			id: community.id,
			name: community.name,
			avatar: community.avatar,
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
			avatar: community.avatar,
		},
	})

	const onSubmit = async (data: z.infer<typeof communitySettingsSchema>) => {
		const result = await runUpdateCommunity({ data })
		if (result && "success" in result) {
			toast.success("Community settings updated")
			communityForm.reset(data)
		} else if (result && "error" in result) {
			toast.error(result.error)
		}
	}

	const onSubmitAvatar = async (data: { avatar: string | null }) => {
		const result = await runUpdateAvatar({
			communityId: community.id as CommunitiesId,
			fileName: data.avatar,
		})
		if (result && "success" in result) {
			toast.success("Community avatar updated")
			return
		}

		avatarForm.resetField("avatar")
	}

	const [deleteConfirmation, setDeleteConfirmation] = useState("")
	const [isDeleting, setIsDeleting] = useState(false)

	const handleDelete = async () => {
		if (deleteConfirmation !== community.name) {
			toast.error("Community name does not match")
			return
		}

		setIsDeleting(true)
		const result = await runDeleteCommunity({ communityId: community.id as CommunitiesId })

		if (result && "success" in result) {
			toast.success("Community deleted")
			router.push("/")
		} else {
			toast.error(result.error || "Failed to delete community")
			setIsDeleting(false)
		}
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
						<Field data-invalid={fieldState.invalid} aria-label="Community Avatar">
							<FieldLabel htmlFor={field.name}>Community Avatar</FieldLabel>
							<AvatarEditor
								initials={community.name
									.split(" ")
									.slice(0, 2)
									.map((word) => word[0])
									.join("")
									.toUpperCase()}
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

			<form onSubmit={communityForm.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<input type="hidden" name="id" value={community.id} />

				<Controller
					control={communityForm.control}
					name="name"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid} aria-label="Community Name">
							<FieldLabel htmlFor={field.name}>Community Name</FieldLabel>
							<Input {...field} />
							<FieldError errors={[fieldState.error]} />
						</Field>
					)}
				/>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Field aria-label="Community Slug">
								<FieldLabel htmlFor="slug">Community Slug</FieldLabel>
								<Input
									value={community.slug}
									disabled
									className="cursor-not-allowed"
								/>
								<p className="flex items-center gap-1 text-muted-foreground text-xs">
									<Info className="h-3 w-3" />
									Editing the slug is not supported at the moment
								</p>
							</Field>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								Editing the slug of your community is not supported at the moment.
								Contact support if you need to change it.
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<Button
					type="submit"
					disabled={
						communityForm.formState.isSubmitting ||
						!communityForm.formState.isValid ||
						!communityForm.formState.isDirty
					}
					className="w-min grow-0"
				>
					Save Changes
					{communityForm.formState.isSubmitting && (
						<Loader2 className="h-4 w-4 animate-spin" />
					)}
				</Button>
			</form>

			<div className="border-t pt-8">
				<h3 className="mb-4 font-semibold text-lg">Quick Links</h3>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => router.push(`/c/${communitySlug}/members`)}
					>
						<UsersRound className="mr-2 h-4 w-4" />
						Manage Members
						<ArrowRight className="ml-auto h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => router.push(`/c/${communitySlug}/stages`)}
					>
						<Layers3 className="mr-2 h-4 w-4" />
						Manage Stages
						<ArrowRight className="ml-auto h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => router.push(`/c/${communitySlug}/pub-types`)}
					>
						<ToyBrick className="mr-2 h-4 w-4" />
						Pub Types
						<ArrowRight className="ml-auto h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => router.push(`/c/${communitySlug}/settings/actions`)}
					>
						<Bot className="mr-2 h-4 w-4" />
						Actions
						<ArrowRight className="ml-auto h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => router.push(`/c/${communitySlug}/settings/tokens`)}
					>
						<CurlyBraces className="mr-2 h-4 w-4" />
						API Tokens
						<ArrowRight className="ml-auto h-3 w-3" />
					</Button>
				</div>
			</div>

			<div className="border-t pt-8">
				<h3 className="mb-2 flex items-center gap-2 font-semibold text-destructive text-lg">
					<AlertTriangle className="h-5 w-5" />
					Danger Zone
				</h3>
				<p className="mb-4 text-muted-foreground text-sm">
					Deleting your community is permanent and cannot be undone. All data, including
					pubs, stages, forms, and members will be permanently deleted.
				</p>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" className="w-fit">
							<Trash2 className="mr-2 h-4 w-4" />
							Delete Community
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex items-center gap-2 text-destructive">
								<AlertTriangle className="h-5 w-5" />
								Are you absolutely sure?
							</AlertDialogTitle>
							<AlertDialogDescription className="space-y-4">
								<p>
									This action cannot be undone. This will permanently delete the{" "}
									<strong>{community.name}</strong> community and remove all
									associated data from our servers.
								</p>
								<p>
									This includes all pubs, stages, forms, member data, and any
									other content associated with this community.
								</p>
								<div className="space-y-2">
									<p className="font-semibold text-foreground">
										Please type{" "}
										<span className="font-mono">{community.name}</span> to
										confirm:
									</p>
									<Input
										value={deleteConfirmation}
										onChange={(e) => setDeleteConfirmation(e.target.value)}
										placeholder={community.name}
										className="font-mono"
									/>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault()
									handleDelete()
								}}
								disabled={deleteConfirmation !== community.name || isDeleting}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{isDeleting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Deleting...
									</>
								) : (
									"Delete Community"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	)
}
