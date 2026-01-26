"use client"

import type { CoreSchemaType, InputComponent, PubsId } from "db/public"
import type { ControllerRenderProps } from "react-hook-form"
import type { InputTypeForCoreSchemaType } from "schemas"
import type { ElementProps } from "../types"

import { useCallback } from "react"
import dynamic from "next/dynamic"
import { Value } from "@sinclair/typebox/value"
import { useTheme } from "next-themes"
import { useFormContext } from "react-hook-form"
import { fileUploadConfigSchema } from "schemas"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Skeleton } from "ui/skeleton"
import { toast } from "ui/use-toast"

import { isClientException, useServerAction } from "~/lib/serverActions"
import { usePubForm } from "../../providers/PubFormProvider"
import { deleteFile, upload } from "../actions"
import { FileUploadPreview } from "../FileUpload"
import { useFormElementToggleContext } from "../FormElementToggleContext"

const FileUpload = dynamic(
	async () => import("ui/customRenderers/fileUpload/fileUpload").then((mod) => mod.FileUpload),
	{
		ssr: false,
		// TODO: make sure this is the same height as the file upload, otherwise looks ugly
		loading: () => <Skeleton className="h-[182px] w-full" />,
	}
)

type FormValues = {
	[slug: string]: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>
}

export const FileUploadElement = ({
	pubId,
	slug,
	label,
	config,
}: ElementProps<InputComponent.fileUpload> & { pubId?: PubsId }) => {
	const runUpload = useServerAction(upload)
	const signedUploadUrl = (fileName: string) => {
		return runUpload(fileName, "temporary")
	}
	const runDelete = useServerAction(deleteFile)
	const { form, mode } = usePubForm()

	const { resolvedTheme } = useTheme()

	const { control } = useFormContext<FormValues>()

	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(slug)

	const handleDeleteFile = useCallback(
		async (
			file: InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>[number],
			field: ControllerRenderProps<FormValues, string>
		) => {
			const modeObj =
				mode === "edit"
					? ({ mode: "edit", pubId: pubId! } as const)
					: ({ mode: "create" } as const)
			const res = await runDelete({
				fileUrl: file.fileUploadUrl,
				formSlug: form.slug,
				fieldSlug: slug,
				...modeObj,
			})

			if (isClientException(res)) {
				return
			}

			field.onChange(field.value.filter((f) => f.fileName !== file.fileName))
			toast.success("Removed file")
		},
		[runDelete, slug, pubId, form.slug, mode]
	)

	if (!Value.Check(fileUploadConfigSchema, config)) {
		return null
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				// Need the isolate to keep the FileUpload's huge z-index from covering our own header
				return (
					<FormItem className="isolate">
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<FileUpload
								{...field}
								theme={resolvedTheme as "light" | "dark"}
								disabled={!isEnabled}
								upload={signedUploadUrl}
								onUpdateFiles={(event) => {
									const newFiles = [
										...(field.value ?? []),
										...event.filter(
											(f) =>
												!(field.value ?? []).some(
													(f2) => f2.fileName === f.fileName
												)
										),
									]
									field.onChange(newFiles)
								}}
								id={slug}
							/>
						</FormControl>
						{config.help && <FormDescription>{config.help}</FormDescription>}
						{field.value && field.value.length > 0 ? (
							<FileUploadPreview
								files={field.value}
								onDelete={(file) => handleDeleteFile(file, field)}
							/>
						) : null}
						<FormMessage />
					</FormItem>
				)
			}}
		/>
	)
}
