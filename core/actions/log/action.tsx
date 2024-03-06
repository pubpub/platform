import * as z from "zod";
import * as fields from "../fields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "log",
	fields: [fields.title],
	config: z.object({
		debounce: z.number().optional(),
	}),
	pubConfig: z.object({}),
});

export { run } from "./run";
