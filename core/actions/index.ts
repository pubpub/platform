import * as log from "./log/action";

export const actions = {
	[log.action.name]: {
		action: log.action,
		run: log.run,
	},
};
