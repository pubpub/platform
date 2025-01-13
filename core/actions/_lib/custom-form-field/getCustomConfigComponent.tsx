import type { actions } from "../../api"
import type { ActionConfigServerComponent } from "./defineConfigServerComponent"

export const getCustomConfigComponentByActionName = async <
	A extends keyof typeof actions,
	T extends "config" | "params",
	C extends Extract<keyof (typeof actions)[A][T]["schema"]["_output"], string>,
>(
	actionName: A,
	type: T,
	fieldName: C
) => {
	try {
		const action = await import(`../../${actionName}/${type}/${fieldName}.field.tsx`)
		return action.default as ActionConfigServerComponent<(typeof actions)[A], T>
	} catch (error) {
		return null
	}
}
