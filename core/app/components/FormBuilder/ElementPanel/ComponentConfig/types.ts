import type { Static } from "@sinclair/typebox";
import type { UseFormReturn } from "react-hook-form";
import type { componentConfigSchemas } from "schemas";

import type { CoreSchemaType, InputComponent } from "db/public";

export type ComponentConfigFormProps<I extends InputComponent = InputComponent> = I extends I
	? {
			form: UseFormReturn<ConfigFormData<I>>;
			schemaName: CoreSchemaType;
			component: I;
		}
	: never;

export type InnerFormProps<I extends InputComponent = InputComponent> = Omit<
	ComponentConfigFormProps<I>,
	"component"
>;

export type ConfigFormData<I extends InputComponent = InputComponent> = I extends I
	? {
			required: boolean | null;
			component: I;
			config: Static<(typeof componentConfigSchemas)[I]>;
		}
	: never;
