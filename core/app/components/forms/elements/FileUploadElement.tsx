"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { fileUploadConfigSchema } from "schemas";

import type { InputComponent, PubsId } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useServerAction } from "~/lib/serverActions";
import { upload } from "../actions";
import { FileUploadPreview } from "../FileUpload";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <div>Loading...</div>,
	}
);

export const FileUploadElement = ({
	pubId,
	slug,
	label,
	config,
}: ElementProps<InputComponent.fileUpload> & { pubId?: PubsId }) => {
	const runUpload = useServerAction(upload);
	const signedUploadUrl = (fileName: string) => {
		return runUpload(fileName, pubId);
	};
	const { control, getValues, formState } = useFormContext();

	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);
	const files = getValues()[slug];

	if (!Value.Check(fileUploadConfigSchema, config)) {
		return null;
	}

	return (
		<div>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					// Need the isolate to keep the FileUpload's huge z-index from covering our own header
					return (
						<FormItem className="isolate mb-6">
							<FormLabel>{label}</FormLabel>
							<FormControl>
								<FileUpload
									{...field}
									disabled={!isEnabled}
									upload={signedUploadUrl}
									onUpdateFiles={(event) => {
										field.onChange(event);
									}}
									id={slug}
								/>
							</FormControl>
							<FormDescription>{config.help}</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			{files ? <FileUploadPreview files={files} /> : null}
		</div>
	);
};
