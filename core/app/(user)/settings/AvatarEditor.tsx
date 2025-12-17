import type { UserLoginData } from "~/lib/types"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Pencil, PlusCircle, XIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { Skeleton } from "ui/skeleton"

const FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: make sure this is the same height as the file upload, otherwise looks ugly
		loading: () => <Skeleton className="h-[182px] w-full" />,
	}
)

export const AvatarEditor = ({
	user,
	avatar,
	onEdit,
	upload,
	allowedFileTypes,
}: {
	user: UserLoginData
	avatar: string | null
	onEdit: (avatar: string | null) => void
	upload: (fileName: string) => Promise<string | { error: string }>
	allowedFileTypes?: string[]
}) => {
	const [popoverOpen, setPopoverOpen] = useState(false)
	const { resolvedTheme } = useTheme()

	return (
		<div className="group relative">
			<Avatar className="group/avatar relative h-20 w-20">
				<AvatarImage src={avatar ?? undefined} />
				<AvatarFallback>
					{user.firstName[0]}
					{user.lastName?.[0]}
				</AvatarFallback>
				{
					<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-full w-full p-0"
							>
								{avatar ? (
									<Pencil className="hidden group-hover/avatar:block" size="20" />
								) : (
									<PlusCircle
										size="20"
										className="hidden size-6 bg-muted group-hover/avatar:block"
									/>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="flex flex-col gap-y-4 p-0">
							<FileUpload
								theme={resolvedTheme as "light" | "dark"}
								upload={upload}
								restrictions={{
									allowedFileTypes: allowedFileTypes ?? [
										"image/jpeg",
										"image/png",
										"image/webp",
										"image/avif",
									],
									maxNumberOfFiles: 1,
								}}
								onUpdateFiles={async (event) => {
									const avatarUrl = event[0].fileUploadUrl
									if (!avatarUrl) return
									onEdit(avatarUrl)
									setPopoverOpen(false)
								}}
								id="avatar"
							/>
						</PopoverContent>
					</Popover>
				}
			</Avatar>
			{user.avatar && (
				<Button
					type="button"
					variant="ghost"
					className="-top-2 absolute left-20 z-10 hidden h-8 w-8 p-0 group-hover:flex"
					aria-label="Delete avatar"
					onClick={async () => {
						onEdit(null)
					}}
				>
					<XIcon className="h-4 w-4 text-destructive" />
				</Button>
			)}
		</div>
	)
}
