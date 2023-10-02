import { NextRequest, NextResponse } from "next/server";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import prisma from "~/prisma/db";

// This route responds to a supabase webhook that fires on any updates to the auth.users table.
// Although it receives requests for any change to the users table, this function only updates a
// user when they change and confirm their email.
export async function POST(req: NextRequest) {
    const serverKey = process.env.SUPABASE_WEBHOOKS_API_KEY!
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
        return NextResponse.json({ error: "Authorization header missing" }, { status: 401 })
    }
    compareAPIKeys(getBearerToken(authHeader), serverKey)

    const body = await req.json();
    if (!body.record || !body.oldRecord) {
        console.log("unexpected webhook payload:", body)
        return NextResponse.json({ error: "Unexpected webhook payload" }, { status: 400 });
    }

    if (body.record.email !== body.oldRecord.email) {
        await prisma.user.update({
            where: {
                id: body.record.id
            },
            data: {
                email: body.record.email
            }
        });
        return NextResponse.json({ message: `User ${body.record.id} updated email to ${body.record.email}`}, { status: 200 });
    }

    return NextResponse.json({}, { status: 200 });
}