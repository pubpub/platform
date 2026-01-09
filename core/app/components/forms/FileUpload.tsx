import type { CoreSchemaType } from "db/public"
import type { InputTypeForCoreSchemaType } from "schemas"

import { FileAudio, FileImage, FilePen, FileSpreadsheet, FileVideo } from "lucide-react"

import { Button } from "ui/button"
import { Card, CardContent } from "ui/card"
import { ExternalLink, FileText, Trash2 } from "ui/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B"

	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

type FileTypeInfo = {
	description: string
	icon: typeof FileText
}

function getFileTypeInfo(mimeType: string): FileTypeInfo {
	if (mimeType.startsWith("image/")) {
		if (mimeType === "image/svg+xml") {
			return { description: "SVG image", icon: FilePen }
		}
		return { description: "Image file", icon: FileImage }
	}

	if (mimeType === "application/pdf") {
		return { description: "PDF document", icon: FileText }
	}

	if (
		mimeType === "text/csv" ||
		mimeType === "application/vnd.ms-excel" ||
		mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return { description: "Spreadsheet", icon: FileSpreadsheet }
	}

	if (
		mimeType === "application/msword" ||
		mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return { description: "Document", icon: FileText }
	}

	if (mimeType.startsWith("video/")) {
		return { description: "Video file", icon: FileVideo }
	}

	if (mimeType.startsWith("audio/")) {
		return { description: "Audio file", icon: FileAudio }
	}

	return { description: "Document", icon: FileText }
}

type FileUploadPreviewProps = {
	files: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>
	/** Passing this will allow the file to be deleted  */
	onDelete?: (file: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>[number]) => void
}

export function FileUploadPreview(props: FileUploadPreviewProps) {
	if (!props.files || props.files.length === 0) {
		return null
	}

	const fileCount = props.files.length

	return (
		<section
			className="space-y-2"
			aria-label={`Uploaded files (${fileCount} ${fileCount === 1 ? "file" : "files"})`}
		>
			{props.files.map((file, index) => {
				const fileTypeInfo = getFileTypeInfo(file.fileType)
				const FileIcon = fileTypeInfo.icon
				const _fileTypeDescription = fileTypeInfo.description
				const fileId = `file-${index}-${file.fileName.replace(/[^a-zA-Z0-9]/g, "-")}`

				return (
					<Card
						key={file.fileName}
						className="p-0 transition-colors hover:bg-muted/50"
						role="article"
						aria-labelledby={`${fileId}-name`}
						aria-describedby={`${fileId}-details`}
					>
						<CardContent className="p-3">
							<div className="flex items-center gap-3">
								<div className="shrink-0" aria-hidden="true">
									{file.fileType.startsWith("image/") ? (
										<img
											src={file.fileUploadUrl}
											alt={file.fileName}
											className="size-6 object-cover"
										/>
									) : (
										<FileIcon className="h-5 w-5 text-muted-foreground" />
									)}
								</div>

								<div className="min-w-0 flex-1">
									<p
										id={`${fileId}-name`}
										className="truncate font-medium text-sm"
									>
										{file.fileName}
									</p>
									<p
										id={`${fileId}-details`}
										className="text-muted-foreground text-xs"
									>
										{formatFileSize(file.fileSize)} • {file.fileType}
									</p>
								</div>

								{/** biome-ignore lint/a11y/useSemanticElements: shh */}
								<div
									className="flex shrink-0 items-center gap-1"
									role="group"
									aria-label="File actions"
								>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0"
													asChild
												>
													<a
														href={file.fileUploadUrl}
														target="_blank"
														rel="noopener noreferrer"
														aria-label={`Open ${file.fileName} in new tab`}
													>
														<ExternalLink className="h-4 w-4" />
														<span className="sr-only">Open file</span>
													</a>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Open file</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>

									{props.onDelete && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 text-destructive hover:text-destructive"
														onClick={() => props.onDelete?.(file)}
														aria-label={`Delete ${file.fileName}`}
													>
														<Trash2 className="h-4 w-4" />
														<span className="sr-only">Delete file</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>Delete file</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				)
			})}
		</section>
	)
}
