"use client";

import type { Body, Meta, UppyFile } from "@uppy/core";

import React, { forwardRef, useEffect, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";

// import "./fileUpload.css";
// TODO: impot on prod?
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import type { AwsBody } from "@uppy/aws-s3";

import AwsS3Multipart from "@uppy/aws-s3";

const pluginName = "AwsS3Multipart" as const;

type FileUploadProps = {
	upload: Function;
	onUpdateFiles: Function;
	disabled?: boolean;
	id?: string;
};

const FileUpload = forwardRef(function FileUpload(props: FileUploadProps, ref) {
	const [uppy] = useState(() => new Uppy<Meta, AwsBody>({ id: props.id }).use(AwsS3Multipart));
	useEffect(() => {
		uppy.on("complete", () => {
			const uploadedFiles = uppy.getFiles();
			const formattedFiles = uploadedFiles.map((file) => {
				return {
					id: file.id,
					fileName: file.name,
					fileSource: file.source,
					fileType: file.type,
					fileSize: file.size,
					fileMeta: file.meta,
					fileUploadUrl: file.response?.uploadURL,
					filePreview: file.preview,
				};
			});
			props.onUpdateFiles(formattedFiles);
		});
	}, [props.onUpdateFiles]);

	uppy.getPlugin<AwsS3Multipart<Meta, AwsBody>>(pluginName)!.setOptions({
		// TODO: maybe use more specific types for Meta and Body
		getUploadParameters: async (file) => {
			if (!file || !file.type) {
				throw new Error("Could not read file.");
			}
			const signedUrl = await props.upload(file.name);
			return {
				method: "PUT",
				url: signedUrl,
				headers: {
					"content-type": file.type,
				},
			};
		},
	});
	return (
		<Dashboard
			uppy={uppy}
			disabled={props.disabled}
			id={props.id ? `dashboard-${props.id}` : undefined}
		/>
	);
});

export { FileUpload };
