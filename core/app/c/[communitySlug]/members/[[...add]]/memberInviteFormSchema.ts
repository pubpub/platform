import { z } from "zod";

export const memberInviteFormSchema = z
	.object({
		email: z.string().email({
			message: "Please provide a valid email address",
		}),
		canAdmin: z.boolean().default(false).optional(),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		state: z.enum(["initial", "user-not-found", "user-found"]),
	})
	.superRefine((data, ctx) => {
		if (data.state === "user-not-found" && (!data.firstName || !data.lastName)) {
			ctx.addIssue({
				path: [!data.firstName ? "firstName" : "lastName"],
				code: z.ZodIssueCode.custom,
				message: `Please provide a ${!data.firstName ? "first" : "last"} name`,
			});
			return false;
		}
	});
