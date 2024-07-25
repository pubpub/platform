"use client";

/**
 * Note: we have two "form"s at play here: one is the Form specific to PubPub (renamed to PubPubForm)
 * and the other is a form as in react-hook-form.
 */
import { FormProvider, useForm } from "react-hook-form";

import { cn } from "utils";

import type { Form as PubPubForm } from "~/lib/server/form";
import { FormElement } from "./FormElement";

export const ExternalForm = ({
	elements,
	className,
}: {
	elements: PubPubForm["elements"];
	className?: string;
}) => {
	const methods = useForm();
	const handleSubmit = () => {};

	return (
		<FormProvider {...methods}>
			<form
				onSubmit={methods.handleSubmit(handleSubmit)}
				className={cn("flex flex-col gap-6", className)}
			>
				{elements.map((e) => {
					return <FormElement key={e.elementId} element={e} />;
				})}
			</form>
		</FormProvider>
	);
};
