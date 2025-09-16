import type { FieldConfig, FieldConfigItem } from "ui/auto-form";

export const createDefaultFieldConfig = (
	defaultFields: string[],
	fieldConfig?: FieldConfig<any>
) => {
	const defaultFieldConfig = fieldConfig ?? ({} as FieldConfig<any>);

	for (const field of defaultFields) {
		if (!(field in defaultFieldConfig)) {
			defaultFieldConfig[field] = {
				placeholder: "(use default)",
			} as FieldConfigItem;
			continue;
		}

		defaultFieldConfig[field]!.placeholder = "(use default)";
	}

	return defaultFieldConfig;
};
