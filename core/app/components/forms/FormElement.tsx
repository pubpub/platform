import { defaultComponent } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { CommunityMembershipsId, FormElementsId, PubsId } from "db/public";
import { CoreSchemaType, ElementType, InputComponent } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { ElementProps, FormElements } from "./types";
import type { UnionPick } from "~/lib/types";
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
	values: GetPubResponseBody["values"];
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

	const name = element.label ?? element.slug;

	let input: JSX.Element | undefined;

	if (element.component === InputComponent.textInput) {
		input = (
			<TextInputElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
				type={element.schemaName === CoreSchemaType.Number ? "number" : undefined}
			/>
		);
	} else if (element.component === InputComponent.textArea) {
		input = (
			<TextAreaElement name={name} config={element.config} schemaName={element.schemaName} />
		);
	} else if (element.component === InputComponent.checkbox) {
		input = (
			<CheckboxElement name={name} config={element.config} schemaName={element.schemaName} />
		);
	} else if (element.component === InputComponent.fileUpload) {
		input = (
			<FileUploadElement
				pubId={pubId}
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.confidenceInterval) {
		input = (
			<ConfidenceElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.datePicker) {
		input = <DateElement name={name} config={element.config} schemaName={element.schemaName} />;
	} else if (element.component === InputComponent.memberSelect) {
		const userId = values[element.slug!] as CommunityMembershipsId | undefined;
		input = (
			<MemberSelectElement
				config={element.config}
				schemaName={element.schemaName}
				name={name}
				id={element.id}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	} else if (element.component === InputComponent.radioGroup) {
		input = (
			<RadioGroupElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.checkboxGroup) {
		input = (
			<CheckboxGroupElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.selectDropdown) {
		input = (
			<SelectDropdownElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.multivalueInput) {
		input = (
			<MultivalueInputElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	} else if (element.component === InputComponent.richText) {
		input = (
			<ContextEditorElement
				name={name}
				config={element.config}
				schemaName={element.schemaName}
			/>
		);
	}

	if (input) {
		return element.required ? (
			input
		) : (
			<FormElementToggle name={name} {...element}>
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
