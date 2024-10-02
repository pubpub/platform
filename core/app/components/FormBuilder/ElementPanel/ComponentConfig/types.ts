import type { UseFormReturn } from "react-hook-form";

import type { CoreSchemaType, InputComponent } from "db/public";

export type ComponentConfigFormProps = {
	form: UseFormReturn<ConfigFormData>;
	// onChange: () => void;
	schemaName: CoreSchemaType;
	component: InputComponent;
	// value: unknown;
};

export type InnerFormProps = Omit<ComponentConfigFormProps, "component">;

export type ConfigFormData = {
	required: boolean | null;
	component: InputComponent;
	config: any;
};
