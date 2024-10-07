import type { ChangeEvent } from "react";

import * as React from "react";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { AutoFormInputComponentProps } from "../types";
import { FormControl, FormItem, FormMessage } from "../../form";
import { Input } from "../../input";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";

export default function AutoFormFile({
	label,
	description,
	isRequired,
	fieldConfigItem,
	fieldProps,
	field,
}: AutoFormInputComponentProps) {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
	const [file, setFile] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFile(reader.result as string);
				setFileName(file.name);
				field.onChange(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveClick = () => {
		setFile(null);
	};

	return (
		<FormItem>
			{showLabel && (
				<>
					<AutoFormLabel label={label} isRequired={isRequired} />
					{description && <AutoFormDescription description={description} />}
				</>
			)}

			{!file && (
				<FormControl>
					<Input
						type="file"
						{...fieldPropsWithoutShowLabel}
						onChange={handleFileChange}
						value={""}
					/>
				</FormControl>
			)}
			{file && (
				<div className="flex h-[40px] w-full flex-row items-center justify-between space-x-2 rounded-sm border p-2 text-black focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white dark:text-black dark:focus-visible:ring-0 dark:focus-visible:ring-offset-0">
					<p>{fileName}</p>
					<button onClick={handleRemoveClick} aria-label="Remove image">
						<Trash2 size={16} />
					</button>
				</div>
			)}
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
			<FormMessage />
		</FormItem>
	);
}
