import type { JSONSchemaType } from "ajv";

export type FileUploadFile = {
	fileName: string;
	fileSource: string;
	fileType: string;
	fileSize: number;
	fileMeta: object;
	fileUploadUrl: string;
	filePreview: string;
};
export type FileUpload = FileUploadFile[];

export const FileUpload = {
	$id: "unjournal:fileUpload",
	title: "Upload Files",
	type: "array",
	items: {
		type: "object",
		properties: {
			fileName: {
				type: "string",
			},
			fileSource: {
				type: "string",
			},
			fileType: {
				type: "string",
			},
			fileSize: {
				type: "number",
			},
			fileMeta: {
				type: "object",
			},
			fileUploadUrl: {
				type: "string",
				format: "uri",
			},
			filePreview: {
				type: "string",
				format: "uri",
			},
		},
	},
} as unknown as JSONSchemaType<FileUpload>;
