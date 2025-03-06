/* eslint-disable no-restricted-properties */

export const path = (path: string) => {
	const prefix = `/${process.env.PREFIX || "platform"}${process.env.PR_NUMBER ? `/pr-preview/pr-${process.env.PR_NUMBER}` : ""}`;
	return `${prefix}${path}`;
};
