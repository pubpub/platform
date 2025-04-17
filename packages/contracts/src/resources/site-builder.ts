import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const contract = initContract();

export const siteBuilderApi = contract.router({
	build: {
		method: "POST",
		path: "/build/journal",
		summary: "Build a journal site",
		body: z.object({
			communitySlug: z.string(),
			journalId: z.string().uuid(),
			mapping: z.object({}).optional(),
		}),
		description: "Build a journal site",
		responses: {
			200: z.object({
				success: z.boolean(),
				message: z.string(),
				url: z.string(),
				timestamp: z.number(),
				fileSize: z.number(),
				fileSizeFormatted: z.string(),
			}),
		},
	},
	health: {
		method: "GET",
		path: "/health",
		summary: "Health check",
		description: "Health check",
		responses: {
			200: z.object({
				status: z.literal("ok"),
			}),
		},
	},
});
