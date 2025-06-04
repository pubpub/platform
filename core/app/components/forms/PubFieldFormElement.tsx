import type { JSX } from "react";
import type React from "react";

import type { ProcessedPub } from "contracts";
import type { CommunityMembershipsId, PubsId } from "db/public";
import { CoreSchemaType, InputComponent } from "db/public";
import { logger } from "logger";

import type { InputElement, InputElementForComponent, InputElementProps } from "./types";
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
import { RelatedPubsElement } from "./elements/RelatedPubsElement";
import { SelectDropdownElement } from "./elements/SelectDropdownElement";
import { TextAreaElement } from "./elements/TextAreaElement";
import { TextInputElement } from "./elements/TextInputElement";

export type PubFieldFormElementProps = {
	pubId: PubsId;
	element: InputElement;
	values: ProcessedPub["values"];
};

const elementMap = {
	[InputComponent.textInput]: TextInputElement, // (props) => <TextInputElement {...props} />,
	[InputComponent.textArea]: TextAreaElement, // (props) => <TextAreaElement {...props} />,
	[InputComponent.checkbox]: CheckboxElement, // (props) => <CheckboxElement {...props} />,
	[InputComponent.fileUpload]: FileUploadElement, // (props) => <FileUploadElement {...props} />,
	[InputComponent.confidenceInterval]: ConfidenceElement, // (props) => <ConfidenceElement {...props} />,
	[InputComponent.datePicker]: DateElement, // (props) => <DateElement {...props} />,
	[InputComponent.memberSelect]: (props) => {
		const userId = props.values.find((v) => v.fieldSlug === props.slug)?.value as
			| CommunityMembershipsId
			| undefined;
		return <MemberSelectElement {...props} value={userId} />;
	},
	[InputComponent.radioGroup]: RadioGroupElement, // (props) => <RadioGroupElement {...props} />,
	[InputComponent.checkboxGroup]: CheckboxGroupElement, // (props) => <CheckboxGroupElement {...props} />,
	[InputComponent.selectDropdown]: SelectDropdownElement, // (props) => <SelectDropdownElement {...props} />,
	[InputComponent.multivalueInput]: MultivalueInputElement, // (props) => <MultivalueInputElement {...props} />,
	[InputComponent.richText]: ContextEditorElement, // (props) => <ContextEditorElement {...props} />,
	[InputComponent.colorPicker]: ColorPickerElement, // (props) => <ColorPickerElement {...props} />,
	// [InputComponent.relationBlock]: () RelatedPubsElement, // (props) => <RelatedPubsElement {...props} />,
} as const satisfies {
	[I in Exclude<InputComponent, InputComponent.relationBlock>]: React.ComponentType<Props<I>>;
};

type Props<I extends InputComponent> = {
	pubId: PubsId;
	values: ProcessedPub["values"];
} & InputElementForComponent<I>;

export const PubFieldFormElement = <
	I extends Exclude<InputComponent, InputComponent.relationBlock>,
>(
	props: Props<I>
) => {
	const Component = elementMap[props.component] as React.ComponentType<Props<I>>;
	return <Component {...props} />;

	// if (element.component === InputComponent.textInput) {
	// 	return <TextInputElement {...element} />;
	// }
	// if (element.component === InputComponent.textArea) {
	// 	return <TextAreaElement {...element} />;
	// }
	// if (element.component === InputComponent.checkbox) {
	// 	return <CheckboxElement {...element} />;
	// }
	// if (element.component === InputComponent.fileUpload) {
	// 	return <FileUploadElement pubId={pubId} {...element} />;
	// }
	// if (element.component === InputComponent.confidenceInterval) {
	// 	return <ConfidenceElement {...element} />;
	// }
	// if (element.component === InputComponent.datePicker) {
	// 	return <DateElement {...element} />;
	// }
	// if (element.component === InputComponent.memberSelect) {
	// 	const userId = values.find((v) => v.fieldSlug === element.slug)?.value as
	// 		| CommunityMembershipsId
	// 		| undefined;
	// 	return <MemberSelectElement {...element} value={userId} />;
	// }
	// if (element.component === InputComponent.radioGroup) {
	// 	return <RadioGroupElement {...element} />;
	// }
	// if (element.component === InputComponent.checkboxGroup) {
	// 	return <CheckboxGroupElement {...element} />;
	// }
	// if (element.component === InputComponent.selectDropdown) {
	// 	return <SelectDropdownElement {...element} />;
	// }
	// if (element.component === InputComponent.multivalueInput) {
	// 	return <MultivalueInputElement {...element} />;
	// }
	// if (element.component === InputComponent.richText) {
	// 	return <ContextEditorElement {...element} />;
	// }
	// if (element.component === InputComponent.colorPicker) {
	// 	return <ColorPickerElement {...element} />;
	// }

	// logger.error({
	// 	msg: `Encountered unknown component when rendering form element`,
	// 	component: element.component,
	// 	element,
	// 	pubId,
	// });
	// return null;
};
