import * as z from "zod";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "log",
	config: z.object({
		debounce: z.number().optional().describe("Debounce time in milliseconds."),
	}),
	description: "Log a pub to the console",
	pubConfig: z.object({}),
	pubFields: [corePubFields.title],
});

export { run } from "./run";
