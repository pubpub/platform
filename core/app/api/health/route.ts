import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"

import { db } from "~/kysely/database"
import { handleErrors } from "~/lib/server"

export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		const errors: string[] = []
		try {
			const dbQuery = await db.selectFrom("communities").selectAll().executeTakeFirstOrThrow()
		} catch (err) {
			if (err instanceof Error) {
				errors.push(err.message)
			}
		}

		if (errors.length > 0) {
			return NextResponse.json({ errors }, { status: 500 })
		}

		return NextResponse.json({})
	})
}
