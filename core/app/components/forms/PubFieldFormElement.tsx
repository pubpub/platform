import { defaultComponent } from "schemas";

import type { ProcessedPub } from "contracts";
import type { CommunityMembershipsId, PubsId } from "db/public";
import { CoreSchemaType, InputComponent } from "db/public";
import { logger } from "logger";

import type { PubFieldElement } from "./types";
import { CheckboxElement } from "./elements/CheckboxElement";
import { CheckboxGroupElement } from "./elements/CheckboxGroupElement";
import { ColorPickerElement } from "./elements/ColorPickerElement";
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

export type PubFieldFormElementProps = {
	pubId: PubsId;
	element: PubFieldElement;
	values: ProcessedPub["values"];
};

export const PubFieldFormElement = ({
	pubId,
	element: propElement,
	values,
	label,
	slug,
}: PubFieldFormElementProps & { label: string; slug: string }) => {
	const element = {
		...propElement,
		component:
			propElement.component ??
			(propElement.schemaName ? defaultComponent(propElement.schemaName) : null),
	} as typeof propElement;

	const basicProps = {
		label,
		slug,
	};

	if (element.component === InputComponent.textInput) {
		return (
			<TextInputElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
				type={element.schemaName === CoreSchemaType.Number ? "number" : undefined}
			/>
		);
	}
	if (element.component === InputComponent.textArea) {
		return (
			<TextAreaElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.checkbox) {
		return (
			<CheckboxElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.fileUpload) {
		return (
			<FileUploadElement
				pubId={pubId}
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.confidenceInterval) {
		return (
			<ConfidenceElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.datePicker) {
		return (
			<DateElement {...basicProps} config={element.config} schemaName={element.schemaName} />
		);
	}
	if (element.component === InputComponent.memberSelect) {
		const userId = values.find((v) => v.fieldSlug === element.slug)?.value as
			| CommunityMembershipsId
			| undefined;
		return (
			<MemberSelectElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
				value={userId}
			/>
		);
	}
	if (element.component === InputComponent.radioGroup) {
		return (
			<RadioGroupElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.checkboxGroup) {
		return (
			<CheckboxGroupElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.selectDropdown) {
		return (
			<SelectDropdownElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.multivalueInput) {
		return (
			<MultivalueInputElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.richText) {
		return (
			<ContextEditorElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}
	if (element.component === InputComponent.colorPicker) {
		return (
			<ColorPickerElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
			/>
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
