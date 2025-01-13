import type { Static } from "@sinclair/typebox"
import type { UseFormReturn } from "react-hook-form"
import type { componentConfigSchemas } from "schemas"

import type { CoreSchemaType, InputComponent } from "db/public"

export type ComponentConfigFormProps<I extends InputComponent> = {
	form: UseFormReturn<ConfigFormData<I>>
	schemaName: CoreSchemaType
	component: I
}

export type ConfigFormData<I extends InputComponent> = {
	required: boolean | null
	component: I
	config: Static<(typeof componentConfigSchemas)[I]>
}

export type FormType<I extends InputComponent> = UseFormReturn<ConfigFormData<I>>
