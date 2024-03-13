import { z } from "zod";

export const memberInviteFormSchema = z.object({
	email: z.string().email({
		message: "Please provide a valid email address",
	}),
	canAdmin: z.boolean().default(false).optional(),
	firstName: z.string(),
	lastName: z.string(),
});
