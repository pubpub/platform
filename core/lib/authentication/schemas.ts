import { z } from "zod"

export const setupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().min(1),
	lastName: z.string().optional(),
	communityName: z.string().min(1),
	communitySlug: z.string().min(1),
	communityAvatar: z.string().optional(),
})
