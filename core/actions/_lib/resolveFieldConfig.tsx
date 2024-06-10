import { logger } from "logger";

import type Action from "~/kysely/types/public/Action";
import { getActionByName } from "../api";
import { getCustomConfigComponentByActionName } from "./getCustomConfigComponent";

export const resolveFieldConfig = async <A extends Action, T extends "config" | "params">(
	actionName: A,
	type: T,
	props
) => {
	const action = getActionByName(actionName);

	const fieldConfig = action[type].fieldConfig;

	if (!fieldConfig) {
		return undefined;
	}

	const resolvedFields = await Promise.all(
		Object.entries(fieldConfig).map(async ([fieldName, fieldConfig]) => {
			logger.info(fieldConfig);
			if (fieldConfig.fieldType !== "custom") {
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
						`Custom field ${fieldName} for action ${action.name} does not export a default component`
					);
				}

				const fullComponent = <CustomComponent {...props} />;

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
