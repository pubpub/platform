import type { Action } from "./types";
import * as email from "./email/action";
import * as log from "./log/action";
import * as pdf from "./pdf/action";

export const actions = {
	[log.action.name]: {
		action: log.action,
	},
	[pdf.action.name]: {
		action: pdf.action,
	},
	[email.action.name]: {
		action: email.action,
	},
};

export const getActionByName = (name: string): Action | undefined => {
	return actions[name]?.action;
};

// export const getActionRunFunctionByName = (name: string) => {
// 	return actions[name]?.run;
// };
