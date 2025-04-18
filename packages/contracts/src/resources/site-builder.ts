import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const contract = initContract();

export const siteBuilderApi = contract.router({
	build: {
		method: "POST",
		path: "/build/journal",
		summary: "Build a journal site",
		headers: z.object({
			// Auth header
			authorization: z.string().startsWith("Bearer "),
		}),
		body: z.object({
			communitySlug: z.string(),
			journalId: z.string().uuid(),
			mapping: z.object({}).optional(),
			uploadToS3Folder: z.boolean().optional(),
			siteUrl: z.string(),
		}),
		description: "Build a journal site",
		responses: {
			200: z.object({
				success: z.literal(true),
				message: z.string(),
				url: z.string(),
				timestamp: z.number(),
				fileSize: z.number(),
				fileSizeFormatted: z.string(),
				s3FolderUrl: z.string().optional(),
				s3FolderPath: z.string().optional(),
			}),
			401: z.object({
				success: z.literal(false),
				message: z.string(),
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
