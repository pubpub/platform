import { fn } from "storybook/test";

export const runActionInstance = fn(async () => {
	return {
		success: true,
		result: "Mock action ran",
	};
}).mockName("runActionInstance");
