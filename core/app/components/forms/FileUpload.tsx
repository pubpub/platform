import type { InputTypeForCoreSchemaType } from "schemas";

import { FileAudio, FileImage, FilePen, FileSpreadsheet, FileVideo } from "lucide-react";

import type { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { ExternalLink, FileText, Trash2 } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";

	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// TODO: make nicer
function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) {
		if (mimeType === "image/svg+xml") {
			return FilePen;
		}
		return FileImage;
	}

	if (mimeType === "application/pdf") {
		return FileText; // could use a PDF icon
	}

	if (
		mimeType === "text/csv" ||
		mimeType === "application/vnd.ms-excel" ||
		mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return FileSpreadsheet;
	}

	if (
		mimeType === "application/msword" ||
		mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return FileText;
	}

	if (mimeType.startsWith("video/")) {
		return FileVideo;
	}

	if (mimeType.startsWith("audio/")) {
		return FileAudio;
	}

	return FileText;
}

export function FileUploadPreview({
	files,
	onDelete,
}: {
	files: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>;
	onDelete?: (file: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>[number]) => void;
}) {
	if (!files || files.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			{files.map((file) => {
				const FileIcon = getFileIcon(file.fileType);

				return (
					<Card key={file.fileName} className="p-0 transition-colors hover:bg-muted/50">
						<CardContent className="p-3">
							<div className="flex items-center gap-3">
								{/* file icon */}
								<div className="flex-shrink-0">
									<FileIcon className="h-5 w-5 text-muted-foreground" />
								</div>

								{/* file details */}
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">
										{file.fileName}
									</div>
									<div className="text-xs text-muted-foreground">
										{formatFileSize(file.fileSize)} • {file.fileType}
									</div>
								</div>

								{/* action buttons */}
								<div className="flex flex-shrink-0 items-center gap-1">
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
													>
														<ExternalLink className="h-4 w-4" />
													</a>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Open file</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>

									{onDelete && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 text-destructive hover:text-destructive"
														onClick={() => onDelete(file)}
													>
														<Trash2 className="h-4 w-4" />
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
				);
			})}
		</div>
	);
}
