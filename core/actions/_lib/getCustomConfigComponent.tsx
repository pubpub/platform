import type { z } from "zod";

import type { actions } from "../api";
import type { ActionConfigServerComponent } from "./defineConfigServerComponent";
import type { ActionContext } from "./defineFormContext";
import { defineActionContext } from "./defineFormContext";

export const getCustomConfigComponentByActionName = async <
	A extends keyof typeof actions,
	T extends "config" | "params",
	C extends Extract<keyof z.infer<(typeof actions)[A][T]["schema"]>, string>,
>(
	actionName: A,
	type: T,
	fieldName: C
) => {
	try {
		const action = await import(`../${actionName}/${type}/${fieldName}.field.tsx`);
		return action.default as ActionConfigServerComponent<(typeof actions)[A], T>;
	} catch (error) {
		return null;
	}
};

export const getCustomFormContextByActionName = async <T extends keyof typeof actions>(
	actionName: T,
	type: "config" | "params"
) => {
	try {
		const action = await import(`../${actionName}/${type}/${type}Context.tsx`);
		return action.default as ActionContext<(typeof actions)[T], typeof type>;
	} catch (error) {
		const fakeActionContext: ActionContext<(typeof actions)[T], typeof type> = async ({
			children,
			...args
		}) => <>{children}</>;

		return fakeActionContext;
	}
};
