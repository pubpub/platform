"use client";

import { useFormContext } from "react-hook-form";

import type { PubsId } from "db/public";
import type { InputProps } from "ui/input";
import type { TextareaProps } from "ui/textarea";
import { ElementType, InputComponent } from "db/public";
import { logger } from "logger";
import { Checkbox } from "ui/checkbox";
import { Confidence } from "ui/customRenderers/confidence/confidence";
import { FileUpload } from "ui/customRenderers/fileUpload/fileUpload";
import { DatePicker } from "ui/date-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import { FileUploadPreview } from "~/app/c/[communitySlug]/pubs/[pubId]/components/FileUpload";
import { upload } from "./actions";

interface ElementProps {
	label: string;
	name: string;
}

const TextInputElement = ({ label, name, ...rest }: ElementProps & InputProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Input
								data-testid={name}
								value={value ?? ""}
								{...fieldRest}
								{...rest}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const TextAreaElement = ({ label, name, ...rest }: ElementProps & TextareaProps) => {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Textarea
								data-testid={name}
								value={value ?? ""}
								{...fieldRest}
								{...rest}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const CheckboxElement = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<div className="flex items-center gap-2">
							<FormControl>
								<Checkbox
									checked={Boolean(field.value)}
									onCheckedChange={(change) => {
										if (typeof change === "boolean") {
											field.onChange(change);
										}
									}}
									className="rounded"
								/>
							</FormControl>
							<FormLabel>{label}</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const FileUploadElement = ({ pubId, label, name }: ElementProps & { pubId: PubsId }) => {
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

const ConfidenceSliderElement = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			defaultValue={[0, 0, 0]}
			render={({ field }) => (
				<FormItem className="mb-6">
					<FormLabel className="text-[0.9em]">{label}</FormLabel>
					<FormControl>
						<Confidence
							{...field}
							value={Array.isArray(field.value) ? field.value : [0, 0, 0]}
							min={0}
							max={100}
							onValueChange={(event) => field.onChange(event)}
							className="confidence"
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

const DateElement = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();
	return (
		<FormField
			name={name}
			control={control}
			render={({ field }) => (
				<FormItem className="grid gap-2">
					<FormLabel>{label}</FormLabel>
					<DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

/**
 * Renders every CoreSchemaType EXCEPT MemberId!
 */
export const FormElement = ({
	pubId,
	element,
}: {
	pubId: PubsId;
	element: Form["elements"][number];
}) => {
	const { component, label: labelProp, slug } = element;
	if (!slug) {
		if (element.type === ElementType.structural) {
			return (
				<div
					className="prose"
					// TODO: sanitize content
					dangerouslySetInnerHTML={{ __html: expect(element.content) }}
				/>
			);
		}
		return null;
	}

	if (!component) {
		return null;
	}

	const elementProps = { label: labelProp ?? "", name: slug };
	if (component === InputComponent.textInput) {
		return <TextInputElement {...elementProps} />;
	}
	if (component === InputComponent.textArea) {
		return <TextAreaElement {...elementProps} />;
	}
	if (component === InputComponent.checkbox) {
		return <CheckboxElement {...elementProps} />;
	}
	if (component === InputComponent.fileUpload) {
		return <FileUploadElement pubId={pubId} {...elementProps} />;
	}
	if (component === InputComponent.confidenceInterval) {
		return <ConfidenceSliderElement {...elementProps} />;
	}
	if (component === InputComponent.datePicker) {
		return <DateElement {...elementProps} />;
	}
	logger.error(
		`Unknown component ${component} when rendering ${element.label} (${element.slug}, ${element.schemaName})`
	);
	return null;
};
