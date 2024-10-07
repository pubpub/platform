"use client";

import type { ComponentType } from "react";

import dynamic from "next/dynamic";

import { InputComponent } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { ComponentConfigFormProps, InnerFormProps } from "./types.ts";

const ALLOWED_PATHS = [
	"Checkbox",
	"ConfidenceInterval",
	"DatePicker",
	"FileUpload",
	"MemberSelect",
	"TextArea",
	"TextInput",
] as const;
type AllowedPaths = (typeof ALLOWED_PATHS)[number];

const toDynamic = (path: AllowedPaths): ComponentType<InnerFormProps> =>
	// this dynamic import path needs to provide enough information for webpack/turbopack
	// to be able to find it. The relative path and the extension are enough, but something like
	// `import(path)` will not work.
	dynamic(() => import(`./${path}.tsx`), {
		ssr: false,
		loading: () => <Skeleton className="h-full w-full" />,
	});

const EnumToPath = {
	[InputComponent.checkbox]: toDynamic("Checkbox"),
	[InputComponent.confidenceInterval]: toDynamic("ConfidenceInterval"),
	[InputComponent.datePicker]: toDynamic("DatePicker"),
	[InputComponent.fileUpload]: toDynamic("FileUpload"),
	[InputComponent.memberSelect]: toDynamic("MemberSelect"),
	[InputComponent.textArea]: toDynamic("TextArea"),
	[InputComponent.textInput]: toDynamic("TextInput"),
};

export const ComponentConfig = ({ component, ...props }: ComponentConfigFormProps) => {
	const ConfigComponent = EnumToPath[component];

	return <ConfigComponent {...props} />;
};
