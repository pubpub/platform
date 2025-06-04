import type { InputElement } from "./types";

/**
 * Get the label for a form input element
 * 1. "label" on a FormElement
 * 2. "config.label" on a FormElement
 * 3. the name of the PubField
 **/
export const getLabel = (
	value:
		| Pick<InputElement, "fieldName" | "config">
		| {
				formElementConfig: InputElement["config"];
				fieldName: InputElement["fieldName"];
		  }
) => {
	// Default to the field name
	const defaultLabel = value.fieldName;

	const config = "config" in value ? value.config : value.formElementConfig;

	return ("label" in config ? config.label : defaultLabel) || defaultLabel;
};
