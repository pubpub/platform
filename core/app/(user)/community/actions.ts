import { defineServerAction } from "~/lib/server/defineServerAction";
import prisma from "~/prisma/db";

const createCommunity = defineServerAction(async function createCommunity({
	name,
	slug,
	avatar,
}: {
	name: string;
	slug: string;
	avatar?: string;
}) {
	try {
		await prisma.community.create({
			data: {
				name,
				slug,
				avatar,
			},
		});
	} catch (error) {
		return {
			title: "Failed to create community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

const removeCommunity = defineServerAction(async function removeCommunity({ id }: { id: string }) {
	try {
		await prisma.community.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		return {
			title: "Failed to remove community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
