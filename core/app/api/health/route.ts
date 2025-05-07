import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { getRedisClient } from "~/lib/redis";
import { handleErrors } from "~/lib/server";

export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		try {
			const dbQuery = db
				.selectFrom("communities")
				.select("id")
				.limit(1)
				.executeTakeFirstOrThrow();
			const cacheQuery = (await getRedisClient()).ping();
			await Promise.all([dbQuery, cacheQuery]);
		} catch (err) {
			logger.error({ msg: "error in health check", err });
			return NextResponse.json({}, { status: 500 });
		}

		return NextResponse.json({});
	});
}
