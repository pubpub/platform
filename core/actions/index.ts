import * as log from "./log/action";
import { Action } from "./types";

export const actions = {
	[log.action.name]: {
		action: log.action,
		run: log.run,
	},
};

export const getActionByName = (name: string): Action | undefined => {
	return actions[name]?.action;
};
