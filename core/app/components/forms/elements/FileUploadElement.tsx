"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { fileUploadConfigSchema } from "schemas";

import type { PubsId } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
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
	pubId: propsPubId,
	name,
	config,
}: ElementProps & { pubId: PubsId }) => {
	// Cache the pubId which might be coming from a server side generated randomUuid() that changes
	const [pubId, _] = useState(propsPubId);
	const signedUploadUrl = (fileName: string) => {
		return upload(pubId, fileName);
	};
	const { control, getValues } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const files = getValues()[name];

	if (!Value.Check(fileUploadConfigSchema, config)) {
		return null;
	}

	return (
		<div>
			<FormField
				control={control}
				name={name}
				render={({ field }) => {
					// Need the isolate to keep the FileUpload's huge z-index from covering our own header
					return (
						<FormItem className="isolate mb-6">
							<FormLabel>{config.label ?? name}</FormLabel>
							<FormControl>
								<FileUpload
									{...field}
									disabled={!isEnabled}
									upload={signedUploadUrl}
									onUpdateFiles={(event: any[]) => {
										field.onChange(event);
									}}
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
