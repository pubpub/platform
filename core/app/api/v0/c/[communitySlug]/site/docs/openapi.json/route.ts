import { NextRequest, NextResponse } from "next/server";

import { createOpenApiDocument } from "./openApi";

export const revalidate = 60 * 60 * 24;
export const dynamic = "force-static";

export const GET = async function (
	request: NextRequest,
	{ params }: { params: { communitySlug: string } }
) {
	return NextResponse.json(createOpenApiDocument(params.communitySlug));
};
