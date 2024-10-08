"use client";

import type { ComponentType } from "react";

import dynamic from "next/dynamic";

import { InputComponent } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { ComponentConfigFormProps, InnerFormProps } from "./types.ts";

export const ComponentConfig = ({ component, ...props }: ComponentConfigFormProps) => {
	let ConfigForm: ComponentType<InnerFormProps>;
	switch (component) {
		case InputComponent.checkbox:
			ConfigForm = dynamic(() => import("./Checkbox.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.checkboxGroup:
			ConfigForm = dynamic(() => import("./CheckboxGroup.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.confidenceInterval:
			ConfigForm = dynamic(() => import("./ConfidenceInterval.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.datePicker:
			ConfigForm = dynamic(() => import("./DatePicker.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.fileUpload:
			ConfigForm = dynamic(() => import("./FileUpload.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.memberSelect:
			ConfigForm = dynamic(() => import("./MemberSelect.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.radioGroup:
			ConfigForm = dynamic(() => import("./RadioGroup.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.selectDropdown:
			ConfigForm = dynamic(() => import("./MultivalueBase.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.textArea:
			ConfigForm = dynamic(() => import("./TextArea.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		case InputComponent.textInput:
			ConfigForm = dynamic(() => import("./TextInput.tsx"), {
				ssr: false,
				loading: () => <Skeleton className="h-full w-full" />,
			});
			break;
		default:
			return null;
	}
	return <ConfigForm {...props} />;
};
