import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { captureException } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import { serverEnv } from "~/lib/env/serverEnv";
import { BadRequestError, UnauthorizedError, handleErrors } from "~/lib/server/errors";
import prisma from "~/prisma/db";

// This route responds to a supabase webhook that fires on any updates to the auth.users table.
// Although it receives requests for any change to the users table, this function only updates a
// user when they change and confirm their email.
// For debugging, the responses sent by this handler are stored in supabase under net._http_response
export async function POST(req: NextRequest) {
	return await handleErrors(async () => {
		const serverKey = serverEnv.SUPABASE_WEBHOOKS_API_KEY;
		const authHeader = req.headers.get("authorization");
		if (!authHeader) {
			throw new UnauthorizedError("Authorization header missing");
		}
		compareAPIKeys(getBearerToken(authHeader), serverKey);

		const body = await req.json();
		if (!body.record || !body.old_record) {
			console.error("unexpected webhook payload:", body);
			throw new BadRequestError("Unexpected webhook payload");
		}

		const oldEmail = body.old_record.email;
		const newEmail = body.record.email;

		if (newEmail && newEmail !== oldEmail) {
			try {
				await prisma.user.update({
					where: {
						supabaseId: body.record.id,
					},
					data: {
						email: newEmail,
					},
				});
			} catch (error) {
				if (error instanceof PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						// Unique constraint violated (email already exists)
						const newErr = new BadRequestError(
							`User changed supabase email from ${oldEmail} to ${newEmail} but another account exists for ${newEmail}`
						);
						captureException(newErr);
						throw newErr;
					}
				}
				throw error;
			}
			return NextResponse.json(
				{ message: `User ${body.record.id} updated email to ${body.record.email}` },
				{ status: 200 }
			);
		}

		return NextResponse.json({ message: "No action taken" }, { status: 200 });
	});
}
