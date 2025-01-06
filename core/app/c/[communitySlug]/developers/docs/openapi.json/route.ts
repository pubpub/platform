import { NextRequest, NextResponse } from "next/server";

import { createOpenApiDocument } from "./openApi";

export const dynamic = "force-dynamic";

export const GET = async function (
	request: NextRequest,
	props: { params: Promise<{ communitySlug: string }> }
) {
	const params = await props.params;
	return NextResponse.json(createOpenApiDocument(params.communitySlug));
};
