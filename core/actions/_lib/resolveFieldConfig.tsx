import { use, useEffect, useState } from "react";

import { FieldConfig } from "ui/auto-form";

import { Action } from "../types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const resolveFieldConfig = async (action: Action, type: "config" | "params") => {
	const fieldConfig = action.config.fieldConfig;

	if (!fieldConfig) {
		return undefined;
	}

	const resolvedFields = await Promise.all(
		Object.entries(fieldConfig).map(async ([fieldName, fieldConfig]) => {
			if (fieldConfig.fieldType !== "custom") {
				return [fieldName, fieldConfig] as const;
			}
			await sleep(1000);

			const path = `~/actions/${action.name}/${type}/${fieldName}.field.tsx` as const;
			console.log(path);
			try {
				const customComponent = await import(
					`../${action.name}/${type}/${fieldName}.field.tsx`
				);
				console.log(customComponent);
				if (!customComponent.default) {
					throw new Error(
						`Custom field ${fieldName} for action ${action.name} does not export a default component`
					);
				}

				return [
					fieldName,
					{
						...fieldConfig,
						fieldType: customComponent.default,
					},
				] as const;
			} catch (error) {
				console.log(error);
				throw error;
			}
		})
	);

	return Object.fromEntries(resolvedFields);
};

//  export const useResolvedFieldConfig = async (action: Action, type: "config" | "params") => {

//     const [pending, setPending] = useState(true);
// 	const [resolvedConfig, setResolvedConfig] = useState<FieldConfig | undefined>(undefined);

//     useEffect(() => {

//         const resolve = async () => {
//             const resolvedConfig = await resolveFieldConfig(action, type);
//             setResolvedConfig(resolvedConfig);
//         };

//         resolve();
//     }, []);

//     return resolvedConfig;
// };
