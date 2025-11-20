import type { FileUploadProps, FormattedFile } from "ui/customRenderers/fileUpload/fileUpload"
import type { ImageAttrs } from "../schemas/image"

import { useEditorEventCallback } from "@handlewithcare/react-prosemirror"

import { FileUpload } from "ui/customRenderers/fileUpload/fileUpload"
import { Label } from "ui/label"

import { Alignment } from "../schemas/image"
import { insertMedia } from "../utils/nodes"

export type Upload = FileUploadProps["upload"]

export const ImageUploader = ({ upload, onInsert }: { upload: Upload; onInsert: () => void }) => {
	const onUpload = useEditorEventCallback((view, files: FormattedFile[]) => {
		if (!view) return
		// Reverse the files since files are inserted starting at the selection
		for (const file of files.reverse()) {
			const attrs: ImageAttrs = {
				src: file.fileUploadUrl || "",
				id: "",
				class: null,
				alt: file.fileName,
				linkTo: "",
				width: 100,
				align: Alignment.center,
				fullResolution: false,
			}
			insertMedia(view.state, view.dispatch, attrs)
		}
		onInsert()
	})

	return (
		<div className="flex flex-col gap-2">
			<Label>Media Upload</Label>
			<FileUpload
				upload={upload}
				onUpdateFiles={onUpload}
				id="editor-image-uploader"
				restrictions={{
					allowedFileTypes: ["image/*"],
				}}
			/>
		</div>
	)
}
