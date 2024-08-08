"use client";

import type { UppyFile } from "@uppy/core";

import React, { forwardRef, useEffect } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";

// import "./fileUpload.css";
// TODO: impot on prod?
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import AwsS3 from "@uppy/aws-s3";

const uppy = new Uppy().use(AwsS3);

type FileUploadProps = {
	upload: Function;
	onUpdateFiles: Function;
};

const FileUpload = forwardRef(function FileUpload(props: FileUploadProps, ref) {
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
	uppy.getPlugin("AwsS3")!.setOptions({
		getUploadParameters: async (file: UppyFile) => {
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
	return <Dashboard uppy={uppy} />;
});

export { FileUpload };
