import { z } from "zod"

export const setupSchema = z.object({
	userAvatar: z.string().url().nullable().optional(),
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().min(1),
	lastName: z.string().optional(),
	communityName: z.string().min(1),
	communitySlug: z.string().min(1),
	communityAvatar: z.string().url().nullable().optional(),
})
