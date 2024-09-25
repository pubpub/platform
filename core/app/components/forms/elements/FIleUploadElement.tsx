"use client";

import dynamic from "next/dynamic";
import { useFormContext } from "react-hook-form";

import type { PubsId } from "db/public";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import { upload } from "../actions";
import { FileUploadPreview } from "../FileUpload";

const FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <div>Loading...</div>,
	}
);

export const FileUploadElement = ({ pubId, label, name }: ElementProps & { pubId: PubsId }) => {
	const signedUploadUrl = (fileName: string) => {
		return upload(pubId, fileName);
	};
	const { control, getValues } = useFormContext();
	const files = getValues()[name];
	return (
		<div>
			<FormField
				control={control}
				name={name}
				render={({ field }) => {
					// Need the isolate to keep the FileUpload's huge z-index from covering our own header
					return (
						<FormItem className="isolate mb-6">
							<FormLabel>{label}</FormLabel>
							<FormControl>
								<FileUpload
									{...field}
									upload={signedUploadUrl}
									onUpdateFiles={(event: any[]) => {
										field.onChange(event);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			{files ? <FileUploadPreview files={files} /> : null}
		</div>
	);
};
