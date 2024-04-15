import type { Action } from "../types";
import * as email from "../email/action";
import * as log from "../log/action";
import * as pdf from "../pdf/action";

export const actions = {
	[log.action.name]: log.action,
	[pdf.action.name]: pdf.action,
	[email.action.name]: email.action,
} as const;

export const getActionByName = (name: keyof typeof actions): Action | undefined => {
	return actions[name];
};

export const getActionNames = () => {
	return Object.keys(actions) as (keyof typeof actions)[];
};
