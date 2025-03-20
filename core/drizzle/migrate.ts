import { reset } from "drizzle-seed";

import { database, pg } from "..";
import * as schema from "../schema";

export async function clearDatabase() {
	console.log("🗑️ Clearing database...");
	await reset(database, schema);
}
