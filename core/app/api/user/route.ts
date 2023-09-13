import "server-only";
import { NextRequest, NextResponse } from "next/server";
import prisma from "prisma/db";
import { getServerSupabase } from "lib/supabaseServer";
import { generateHash, getSlugSuffix, slugifyString } from "lib/string";
import { getLoginId } from "lib/auth/loginId";

export type UserPostBody = {
	name: string;
	email: string;
	password: string;
};

export type UserPutBody = {
	name: string;
};

export async function POST(req: NextRequest) {
	const submittedData: UserPostBody = await req.json();
	const { name, email, password } = submittedData;
	const supabase = getServerSupabase();
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
	if (error || !data.user) {
		console.error("Supabase createUser error:");
		console.error(error);
		return NextResponse.json({ message: "Supabase createUser error" }, { status: 500 });
	}
	await prisma.user.create({
		data: {
			id: data.user.id,
			slug: `${slugifyString(name)}-${generateHash(4, "0123456789")}`,
			name,
			email,
		},
	});

	return NextResponse.json({ ok: true }, { status: 200 });
}

export async function PUT(req: NextRequest) {
	const loginId = await getLoginId(req);
	if (!loginId) {
		return NextResponse.json({ ok: false }, { status: 401 });
	}
	const submittedData: UserPutBody = await req.json();
	const { name } = submittedData;
	const currentData = await prisma.user.findUnique({
		where: { id: loginId },
	});
	if (!currentData) {
		return NextResponse.json({ ok: false }, { status: 401 });
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
	return NextResponse.json({ ok: true }, { status: 200 });
}
