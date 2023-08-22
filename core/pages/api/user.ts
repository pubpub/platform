import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
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

export default nextConnect<NextApiRequest, NextApiResponse>()
	.post(async (req, res) => {
		const submittedData: UserPostBody = req.body;
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
			return res.status(500).json("Supabase createUser error");
		}
		await prisma.user.create({
			data: {
				id: data.user.id,
				slug: `${slugifyString(name)}-${generateHash(4, "0123456789")}`,
				name,
				email,
			},
		});

		return res.status(200).json({ ok: true });
	})
	.put(async (req, res) => {
		const loginId = await getLoginId(req);
		if (!loginId) {
			return res.status(401).json({ ok: false });
		}
		const submittedData: UserPutBody = req.body;
		const { name } = submittedData;
		const currentData = await prisma.user.findUnique({
			where: { id: loginId },
		});
		if (!currentData) {
			return res.status(401).json({ ok: false });
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
		return res.status(200).json({ ok: true });
	});
