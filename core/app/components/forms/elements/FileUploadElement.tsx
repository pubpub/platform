"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { fileUploadConfigSchema } from "schemas";

import type { InputComponent, PubsId } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { InputElementProps } from "../types";
import { useServerAction } from "~/lib/serverActions";
import { upload } from "../actions";
import { FileUploadPreview } from "../FileUpload";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

const FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <div>Loading...</div>,
	}
);

export const FileUploadElement = (
	props: InputElementProps<InputComponent.fileUpload> & { pubId: PubsId }
) => {
	const runUpload = useServerAction(upload);
	// Cache the pubId which might be coming from a server side generated randomUuid() that changes
	const [pubId, _] = useState(props.pubId);
	const signedUploadUrl = (fileName: string) => {
		return runUpload(pubId, fileName);
	};
	const { control, getValues } = useFormContext();

	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const files = getValues()[props.slug];
	const label = getLabel(props);

	if (!Value.Check(fileUploadConfigSchema, props.config)) {
		return null;
	}

	return (
		<div>
			<FormField
				control={control}
				name={props.slug}
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
									id={props.slug}
								/>
							</FormControl>
							<FormDescription>{props.config.help}</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			{files ? <FileUploadPreview files={files} /> : null}
		</div>
	);
};
