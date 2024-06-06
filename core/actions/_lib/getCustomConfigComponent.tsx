import { actions } from "../api";
import { ActionConfigServerComponent } from "./defineConfigServerComponent";
import { ActionContext, defineActionContext } from "./defineFormContext";

export const getCustomConfigComponentByActionName = async <T extends keyof typeof actions>(
	actionName: T
) => {
	try {
		const action = await import(`../${actionName}/config-component`);
		return action.default as ActionConfigServerComponent<(typeof actions)[T]>;
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
