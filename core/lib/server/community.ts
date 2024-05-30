import { db } from "~/kysely/database";

export function findCommunityBySlug(communitySlug: string) {
	return db
		.selectFrom("communities")
		.select("id")
		.where("slug", "=", communitySlug)
		.executeTakeFirst();
}
