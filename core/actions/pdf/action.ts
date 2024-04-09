import * as z from "zod";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "pdf",
	config: z.object({
		margin: z.number().optional().describe("Page margin in pixels"),
	}),
	description: "Generate a PDF from a pub",
	pubConfig: z.object({}),
	pubFields: [corePubFields.title],
});

export { run } from "./run";
