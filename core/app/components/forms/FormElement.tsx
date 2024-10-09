import { defaultComponent } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { CoreSchemaType, ElementType, InputComponent } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { ElementProps } from "./types";
import type { Form } from "~/lib/server/form";
import { CheckboxElement } from "./elements/CheckboxElement";
import { CheckboxGroupElement } from "./elements/CheckboxGroupElement";
import { ConfidenceElement } from "./elements/ConfidenceElement";
import { DateElement } from "./elements/DateElement";
import { FileUploadElement } from "./elements/FileUploadElement";
import { MemberSelectElement } from "./elements/MemberSelectElement";
import { RadioGroupElement } from "./elements/RadioGroupElement";
import { TextAreaElement } from "./elements/TextAreaElement";
import { TextInputElement } from "./elements/TextInputElement";
import { FormElementToggle } from "./FormElementToggle";

export type FormElementProps = {
	pubId: PubsId;
	element: Form["elements"][number];
	searchParams: Record<string, unknown>;
	communitySlug: string;
	values: GetPubResponseBody["values"];
};

export const FormElement = ({
	pubId,
	element,
	searchParams,
	communitySlug,
	values,
}: FormElementProps) => {
	const { component: componentProp, slug, schemaName, config } = element;
	const component = componentProp ?? (schemaName && defaultComponent(schemaName));
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

	if (!schemaName || !component) {
		return null;
	}

	const elementProps: ElementProps = { name: slug, schemaName, config };

	let input: JSX.Element | undefined;

	if (component === InputComponent.textInput) {
		input = (
			<TextInputElement
				{...elementProps}
				type={schemaName === CoreSchemaType.Number ? "number" : undefined}
			/>
		);
	} else if (component === InputComponent.textArea) {
		input = <TextAreaElement {...elementProps} />;
	} else if (component === InputComponent.checkbox) {
		input = <CheckboxElement {...elementProps} />;
	} else if (component === InputComponent.fileUpload) {
		input = <FileUploadElement pubId={pubId} {...elementProps} />;
	} else if (component === InputComponent.confidenceInterval) {
		input = <ConfidenceElement {...elementProps} />;
	} else if (component === InputComponent.datePicker) {
		input = <DateElement {...elementProps} />;
	} else if (component === InputComponent.memberSelect) {
		const userId = values[element.slug!] as MembersId | undefined;
		input = (
			<MemberSelectElement
				config={elementProps.config}
				name={elementProps.name}
				id={element.elementId}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	} else if (component === InputComponent.radioGroup) {
		input = <RadioGroupElement {...elementProps} />;
	} else if (component === InputComponent.checkboxGroup) {
		input = <CheckboxGroupElement {...elementProps} />;
	} else if (component === InputComponent.selectDropdown) {
		// TODO: support select dropdown
		return null;
	}

	if (input) {
		return element.required ? (
			input
		) : (
			<FormElementToggle {...elementProps}>{input}</FormElementToggle>
		);
	}

	logger.error({
		msg: `Encountered unknown component when rendering form element`,
		component,
		element,
		pubId,
	});
	return null;
};
