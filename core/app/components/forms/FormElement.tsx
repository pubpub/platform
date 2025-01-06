import { defaultComponent } from "schemas";

import type { ProcessedPub } from "contracts";
import type { CommunityMembershipsId, PubsId } from "db/public";
import { CoreSchemaType, ElementType, InputComponent } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { FormElements } from "./types";
import { CheckboxElement } from "./elements/CheckboxElement";
import { CheckboxGroupElement } from "./elements/CheckboxGroupElement";
import { ConfidenceElement } from "./elements/ConfidenceElement";
import { ContextEditorElement } from "./elements/ContextEditorElement";
import { DateElement } from "./elements/DateElement";
import { FileUploadElement } from "./elements/FileUploadElement";
import { MemberSelectElement } from "./elements/MemberSelectElement";
import { MultivalueInputElement } from "./elements/MultivalueInputElement";
import { RadioGroupElement } from "./elements/RadioGroupElement";
import { SelectDropdownElement } from "./elements/SelectDropdownElement";
import { TextAreaElement } from "./elements/TextAreaElement";
import { TextInputElement } from "./elements/TextInputElement";
import { FormElementToggle } from "./FormElementToggle";

export type FormElementProps = {
	pubId: PubsId;
	element: FormElements;
	searchParams: Record<string, unknown>;
	communitySlug: string;
	values: ProcessedPub["values"];
};

export const FormElement = ({
	pubId,
	element,
	searchParams,
	communitySlug,
	values,
}: FormElementProps) => {
	element.component =
		element.component ??
		((element.schemaName && defaultComponent(element.schemaName)) as typeof element.component);

	if (!element.slug) {
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

	if (!element.schemaName || !element.component) {
		return null;
	}

	const basicProps = {
		label: element.config.label || element.label || element.slug,
		slug: element.slug,
	};

	let input: React.ReactNode | undefined;

	if (element.component === InputComponent.textInput) {
		input = (
			<TextInputElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
				type={element.schemaName === CoreSchemaType.Number ? "number" : undefined}
			/>
		);
	} else if (element.component === InputComponent.textArea) {
		input = (
			<TextAreaElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.checkbox) {
		input = (
			<CheckboxElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.fileUpload) {
		input = (
			<FileUploadElement
				pubId={pubId}
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.confidenceInterval) {
		input = (
			<ConfidenceElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.datePicker) {
		input = (
			<DateElement {...basicProps} config={element.config} schemaName={element.schemaName} />
		);
	} else if (element.component === InputComponent.memberSelect) {
		const userId = values.find((v) => v.fieldSlug === element.slug)?.value as
			| CommunityMembershipsId
			| undefined;
		input = (
			<MemberSelectElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
				id={element.id}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	} else if (element.component === InputComponent.radioGroup) {
		input = (
			<RadioGroupElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.checkboxGroup) {
		input = (
			<CheckboxGroupElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.selectDropdown) {
		input = (
			<SelectDropdownElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.multivalueInput) {
		input = (
			<MultivalueInputElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.richText) {
		input = (
			<ContextEditorElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}

	if (input) {
		return element.required ? (
			input
		) : (
			<FormElementToggle {...element} {...basicProps}>
				{input}
			</FormElementToggle>
		);
	}

	logger.error({
		msg: `Encountered unknown component when rendering form element`,
		component: element.component,
		element,
		pubId,
	});
	return null;
};
