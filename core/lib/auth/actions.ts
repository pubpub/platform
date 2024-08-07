"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Communities, Members, Users } from "db/public";
import { logger } from "logger";

import type { DefinitelyHas, Prettify, XOR } from "../types";
import { REFRESH_NAME, TOKEN_NAME } from "~/lib/auth/cookies";
import { lucia, validateRequest } from "~/lib/auth/lucia";
import { validatePassword } from "~/lib/auth/validatePassword";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getUser } from "~/lib/server/user";
import { getServerSupabase } from "~/lib/supabaseServer";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(72),
});

type LoginUser = Prettify<
	Omit<Users, "orcid" | "avatar" | "salt"> & {
		memberships: (Members & { community: Communities | null })[];
	}
>;

function redirectUser(memberships?: (Members & { community: Communities | null })[]): never {
	if (!memberships?.length) {
		redirect("/settings");
	}

	redirect(`/c/${memberships[0].community?.slug}/stages`);
}

async function supabaseLogin({ user, password }: { user: LoginUser; password: string }) {
	const supabase = getServerSupabase();

	const { data, error } = await supabase.auth.signInWithPassword({ email: user.email, password });

	if (!data.session) {
		return {
			error: "Incorrect email or password",
		};
	}

	cookies().set(TOKEN_NAME, data.session?.access_token);
	cookies().set(REFRESH_NAME, data.session?.refresh_token);

	redirectUser(user.memberships);
}

async function luciaLogin({
	user,
	password,
}: {
	user: DefinitelyHas<LoginUser, "passwordHash">;
	password: string;
}) {
	const validPassword = await validatePassword(password, user.passwordHash);

	if (!validPassword) {
		return {
			error: "Incorrect email or password",
		};
	}
	// lucia authentication
	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	redirectUser(user.memberships);
}

const isLuciaUser = (user: LoginUser): user is LoginUser & { passwordHash: string } =>
	user.passwordHash !== null;

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
		{ additionalSelect: ["users.passwordHash"] }
	).executeTakeFirst();

	if (!user) {
		return {
			error: "Incorrect email or password",
		};
	}

	if (!isLuciaUser(user)) {
		return supabaseLogin({ user, password });
	}

	return luciaLogin({ user, password });
});

async function supabaseLogout(token: string) {
	const supabase = getServerSupabase();
	const signedOut = await supabase.auth.admin.signOut(token);

	if (signedOut.error) {
		logger.error(signedOut.error);
		return {
			error: signedOut.error.message,
		};
	}

	cookies().delete(TOKEN_NAME);
	cookies().delete(REFRESH_NAME);
	redirect("/login");
}

async function luciaLogout() {
	const { session } = await validateRequest();

	if (!session) {
		return {
			error: "Not logged in",
		};
	}

	await lucia.invalidateSession(session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	redirect("/login");
}

export const logout = defineServerAction(async function logout() {
	const token = cookies().get(TOKEN_NAME);

	// signout supabase
	if (token) {
		return supabaseLogout(token.value);
	}

	return luciaLogout();
});
