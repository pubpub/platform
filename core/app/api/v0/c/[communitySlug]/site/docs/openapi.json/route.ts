import { NextRequest, NextResponse } from "next/server";

import { createOpenApiDocument } from "./openApi";

export const dynamic = "force-dynamic";

export const GET = async function (
	request: NextRequest,
	{ params }: { params: { communitySlug: string } }
) {
	return NextResponse.json(createOpenApiDocument(params.communitySlug));
};
