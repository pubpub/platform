import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Communities, Members } from "db/public";

import { lucia } from "~/lib/auth/lucia";
import { validatePassword } from "~/lib/auth/validatePassword";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getUser } from "~/lib/server/user";
import { getServerSupabase } from "~/lib/supabaseServer";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(72),
});

const redirectUser = async (memberships?: (Members & { community: Communities | null })[]) => {
	if (!memberships?.length) {
		redirect("/settings");
	}

	redirect(`/c/${memberships[0].community?.slug}/stages`);
};

export const loginWithPassword = defineServerAction(async function loginWithPassword(props: {
	email: string;
	password: string;
}) {
	const parsed = schema.safeParse({ email: props.email, password: props.password });

	if (parsed.error) {
		return {
			error: parsed.error.message,
		};
	}

	const { email, password } = parsed.data;

	const user = await getUser(
		{ email },
		{
			additionalSelect: ["users.passwordHash"],
		}
	).executeTakeFirst();

	if (!user) {
		return {
			error: "Incorrect email or password",
		};
	}

	// supabase sign in
	if (user.passwordHash === null) {
		const supabase = getServerSupabase();

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (!data.session) {
			return {
				error: "Incorrect email or password",
			};
		}

		cookies().set("sb-access-token", data.session?.access_token);
		cookies().set("sb-refresh-token", data.session?.refresh_token);

		redirectUser(user.memberships);
	}
	const validPassword = await validatePassword(password, user.passwordHash);

	// lucia authentication
	if (validPassword) {
		const session = await lucia.createSession();
	}
});
