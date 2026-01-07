import { z } from "zod"

export const communitySettingsSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Community name is required"),
	avatar: z.string().url().nullable(),
})
