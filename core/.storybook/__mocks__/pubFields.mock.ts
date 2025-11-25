import { fn } from "storybook/test"

export const getPubFields = fn(() => {
	return {
		executeTakeFirstOrThrow: async () => {
			return {
				fields: [],
			}
		},
	}
}).mockName("getPubFields")
