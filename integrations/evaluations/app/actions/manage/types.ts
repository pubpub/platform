import * as z from "zod";
import { Evaluator } from "~/lib/types";

export const InviteFormEvaluator = Evaluator.and(z.object({ selected: z.boolean() }));
export type InviteFormEvaluator = z.infer<typeof InviteFormEvaluator>;
export const InviteFormSchema = z.object({
	evaluators: z.array(InviteFormEvaluator),
});
export type InviteFormSchema = z.infer<typeof InviteFormSchema>;
