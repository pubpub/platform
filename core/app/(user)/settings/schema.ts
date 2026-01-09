import { z } from "zod"

export const userInfoFormSchema = z.object({
	id: z.string().uuid(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
})
