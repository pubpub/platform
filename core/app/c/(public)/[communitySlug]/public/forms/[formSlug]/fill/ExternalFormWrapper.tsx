"use client";

import type { FieldValues } from "react-hook-form";

import { useRouter, useSearchParams } from "next/navigation";

import type { BasicFormElements } from "~/app/components/forms/types";
import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient";
import {
	SAVE_STATUS_QUERY_PARAM,
	SUBMIT_ID_QUERY_PARAM,
} from "~/app/components/pubs/PubEditor/constants";
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient";
import { useTypedPathname } from "~/lib/routing-hooks";

const isComplete = (formElements: BasicFormElements[], values: FieldValues) => {
	const requiredElements = formElements.filter((fe) => fe.required && fe.slug);
	requiredElements.forEach((element) => {
		const value = values[element.slug!];
		if (value == null) {
			return false;
		}
	});
	return true;
};

export const ExternalFormWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter();
	const pathname = useTypedPathname();
	const params = useSearchParams();

	const onSuccess = ({
		values,
		submitButtonId,
		isAutoSave,
	}: {
		values: FieldValues;
		submitButtonId?: string;
		isAutoSave: boolean;
	}) => {
		const newParams = new URLSearchParams(params);
		const currentTime = `${new Date().getTime()}`;
		if (!props.isUpdating) {
			newParams.set("pubId", props.pub.id);
		}

		if (!isAutoSave && isComplete(props.elements, values)) {
			if (submitButtonId) {
				newParams.set(SUBMIT_ID_QUERY_PARAM, submitButtonId);
			}
			router.push(`${pathname}?${newParams.toString()}`);
			return;
		}
		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);
		router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
	};

	return (
		<PubEditorClient {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient>
	);
};
