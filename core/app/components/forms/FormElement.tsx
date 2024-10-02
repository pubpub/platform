import { defaultComponent } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { ElementType, InputComponent } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import { CheckboxElement } from "./elements/CheckboxElement";
import { ConfidenceElement } from "./elements/ConfidenceElement";
import { DateElement } from "./elements/DateElement";
import { FileUploadElement } from "./elements/FIleUploadElement";
import { MemberSelectElement } from "./elements/MemberSelectElement";
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

	const elementProps = { name: slug, schemaName, config };

	let input: JSX.Element | undefined;

	if (component === InputComponent.textInput) {
		input = <TextInputElement {...elementProps} />;
	}
	if (component === InputComponent.textArea) {
		input = <TextAreaElement {...elementProps} />;
	}
	if (component === InputComponent.checkbox) {
		input = <CheckboxElement {...elementProps} />;
	}
	if (component === InputComponent.fileUpload) {
		input = <FileUploadElement pubId={pubId} {...elementProps} />;
	}
	if (component === InputComponent.confidenceInterval) {
		input = <ConfidenceElement {...elementProps} />;
	}
	if (component === InputComponent.datePicker) {
		input = <DateElement {...elementProps} />;
	}
	if (component === InputComponent.memberSelect) {
		const userId = values[element.slug!] as MembersId | undefined;
		input = (
			<MemberSelectElement
				name={elementProps.name}
				id={element.elementId}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	}

	if (input) {
		return <FormElementToggle {...elementProps}>{input}</FormElementToggle>;
	}

	logger.error({
		msg: `Encountered unknown component when rendering form element`,
		component,
		element,
		pubId,
	});
	return null;
};
