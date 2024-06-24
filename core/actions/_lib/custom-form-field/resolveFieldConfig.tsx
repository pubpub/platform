import { logger } from "logger";

import type { Action, ZodObjectOrWrappedOrOptional } from "../../types";
import type { ActionConfigServerComponentProps } from "./defineConfigServerComponent";
import type ActionName from "~/kysely/types/public/Action";
import { getActionByName } from "../../api";
import { getCustomConfigComponentByActionName } from "./getCustomConfigComponent";

const isSchemaKey = <S extends ZodObjectOrWrappedOrOptional>(
	schema: S,
	key: string
): key is Extract<keyof S["_output"], string> => {
	const def = schema["_def"];

	if (def.typeName === "ZodOptional") {
		return isSchemaKey(def.innerType, key);
	}

	if (def.typeName === "ZodEffects") {
		return isSchemaKey(def.schema, key);
	}

	return key in def.shape();
};

export const resolveFieldConfig = async <
	A extends ActionName,
	T extends "config" | "params",
	C extends ActionConfigServerComponentProps<Action, T> = ActionConfigServerComponentProps<
		Action,
		T
	>,
>(
	actionName: A,
	type: T,
	props: C
) => {
	const action = getActionByName(actionName);

	const fieldConfig = action[type].fieldConfig;

	if (!fieldConfig) {
		return undefined;
	}

	const resolvedFields = await Promise.all(
		Object.entries(fieldConfig).map(async ([fieldName, fieldConfig]) => {
			if (fieldConfig.fieldType !== "custom") {
				return [fieldName, fieldConfig] as const;
			}

			if (!isSchemaKey(action[type].schema, fieldName)) {
				return [fieldName, fieldConfig] as const;
			}

			try {
				const CustomComponent = await getCustomConfigComponentByActionName(
					actionName,
					type,
					fieldName
				);

				if (!CustomComponent) {
					throw new Error(
						`Custom field ${fieldName} for ${type} form for action ${action.name} does not export a default component`
					);
				}

				const fullComponent = CustomComponent(props);

				return [
					fieldName,
					{
						...fieldConfig,
						fieldType: fullComponent,
					},
				] as const;
			} catch (error) {
				logger.error(error);
				throw error;
			}
		})
	);

	return Object.fromEntries(resolvedFields);
};
