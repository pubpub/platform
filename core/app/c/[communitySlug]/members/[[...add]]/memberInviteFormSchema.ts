import { z } from "zod";

import { MemberRole } from "db/public";

export const memberInviteFormSchema = z.object({
	email: z.string().email({
		message: "Please provide a valid email address",
	}),
	role: z.nativeEnum(MemberRole).default(MemberRole.editor).optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	isSuperAdmin: z.boolean().default(false).optional(),
});
