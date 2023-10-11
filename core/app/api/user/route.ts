import "server-only";
import { NextRequest, NextResponse } from "next/server";
import prisma from "prisma/db";
import { getServerSupabase } from "lib/supabaseServer";
import { generateHash, getSlugSuffix, slugifyString } from "lib/string";
import { getLoginId } from "lib/auth/loginId";
import { BadRequestError, ForbiddenError, UnauthorizedError, handleErrors } from "~/lib/server";
import { captureException } from "@sentry/nextjs";

export type UserPostBody = {
	name: string;
	email: string;
	password: string;
};

export type UserPutBody = {
	name: string;
};

export async function POST(req: NextRequest) {
	return await handleErrors(async () => {
		const submittedData: UserPostBody = await req.json();
		const { name, email, password } = submittedData;
		const supabase = getServerSupabase();

		const existingUser = await prisma.user.findUnique({
			where: {
				email
			}
		})

		if (existingUser?.supabaseId) {
			throw new ForbiddenError("User already exists")
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: "https://www.pubpub.org/confirm",
			},
		});
		/* Supabase returns:
			{
				user: {
					id: '3d73fdda-5663-4cf1-ba5d-d20e44ec8ade',
					aud: 'authenticated',
					role: 'authenticated',
					email: 'testemail@gmail.com',
					phone: '',
					confirmation_sent_at: '2022-11-15T21:05:38.831540303Z',
					app_metadata: { provider: 'email', providers: [Array] },
					user_metadata: {},
					identities: [ [Object] ],
					created_at: '2022-11-15T21:05:38.821244Z',
					updated_at: '2022-11-15T21:05:39.307552Z'
				},
				session: null
			}
		*/

		console.log("Supabase user", data);
		if (error || !data.user) {
			console.error("Supabase createUser error: ", error);
			captureException(error);
			return NextResponse.json({ message: "Supabase createUser error" }, { status: 500 });
		}

		if (existingUser) {
			await prisma.user.update({
				where: {
					email
				},
				data: {
					supabaseId: data.user.id
				}
			})
			return NextResponse.json({ message: "Existing account claimed" }, { status: 200 })
		} else {
			const newUser = await prisma.user.create({
				data: {
					id: data.user.id,
					slug: `${slugifyString(name)}-${generateHash(4, "0123456789")}`,
					supabaseId: data.user.id,
					name,
					email,
				},
			});
			return NextResponse.json({}, { status: 201 });
		}
	});
}

export async function PUT(req: NextRequest) {
	return await handleErrors(async () => {
		const loginId = await getLoginId(req);
		if (!loginId) {
			throw new UnauthorizedError();
		}
		const submittedData: UserPutBody = await req.json();
		const { name } = submittedData;
		const currentData = await prisma.user.findUnique({
			where: { id: loginId },
		});
		if (!currentData) {
			throw new BadRequestError("Unable to find user");
		}
		const slugSuffix = getSlugSuffix(currentData.slug);
		await prisma.user.update({
			where: {
				id: loginId,
			},
			data: {
				slug: `${slugifyString(name)}-${slugSuffix}`,
				name,
			},
		});
		return NextResponse.json({}, { status: 200 });
	});
}

// Used to determine if an email is available when a user attempts to change theirs
export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		const loginId = await getLoginId(req);
		if (!loginId) {
			throw new UnauthorizedError();
		}

		const email = req.nextUrl.searchParams.get("email");

		if (!email) {
			throw new BadRequestError();
		}

		const emailUsed = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (emailUsed) {
			throw new ForbiddenError("Email already in use");
		}

		return NextResponse.json({ message: "Email is available" }, { status: 200 });
	});
}
