import { NextRequest, NextResponse } from "next/server";

import { findCommunityBySlug } from "~/lib/server/community";

export const GET = async (req: NextRequest) => {
	const slug = req.nextUrl.searchParams.get("slug");
	if (!slug) {
		return new Response("", { status: 400 });
	}

	const { id } = (await findCommunityBySlug(slug)) ?? {};

	return NextResponse.json({ id });
};
