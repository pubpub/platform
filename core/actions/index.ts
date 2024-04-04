import * as log from "./log/action";
import * as pdf from "./pdf/action";
import * as email from "./email/action";
import { Action } from "./types";

export const actions = {
	[log.action.name]: {
		action: log.action,
		run: log.run,
	},
	[pdf.action.name]: {
		action: pdf.action,
		run: pdf.run,
	},
	[email.action.name]: {
		action: email.action,
		run: email.run,
	},
};

export const getActionByName = (name: string): Action | undefined => {
	return actions[name]?.action;
};

export const getActionRunFunctionByName = (name: string) => {
	return actions[name]?.run;
};
