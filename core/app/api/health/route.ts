import { NextRequest, NextResponse } from "next/server";
import { handleErrors } from "~/lib/server";
import { formatSupabaseError } from "~/lib/supabase";
import { getServerSupabase } from "~/lib/supabaseServer";
import prisma from "~/prisma/db";

export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		const errors: string[] = [];
		try {
			const dbQuery = prisma.community.findFirstOrThrow();
			const supabase = getServerSupabase();
			const supabaseCheck = supabase.auth.admin.listUsers({ perPage: 1 });
			const [supabaseResult, dbResult] = await Promise.all([supabaseCheck, dbQuery]);
			if (supabaseResult.error) {
				errors.push("Supabase error: " + formatSupabaseError(supabaseResult.error));
			}
		} catch (err) {
			if (err instanceof Error) {
				errors.push(err.message);
			}
		}

		if (errors.length > 0) {
			return NextResponse.json({ errors }, { status: 500 });
		}

		return NextResponse.json({});
	});
}
