import type { UseFormReturn } from "react-hook-form";

import type { CoreSchemaType, InputComponent } from "db/public";

export type ComponentConfigFormProps = {
	form: UseFormReturn<ConfigFormData>;
	schemaName: CoreSchemaType;
	component: InputComponent;
};

export type InnerFormProps = Omit<ComponentConfigFormProps, "component">;

export type ConfigFormData = {
	required: boolean | null;
	component: InputComponent;
	config: any;
};
