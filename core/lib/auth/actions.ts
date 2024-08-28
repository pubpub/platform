"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import type { Communities, Members, Users, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import type { DefinitelyHas, Prettify } from "../types";
import { db } from "~/kysely/database";
import { REFRESH_NAME, TOKEN_NAME } from "~/lib/auth/cookies";
import { lucia, validateRequest } from "~/lib/auth/lucia";
import { validatePassword } from "~/lib/auth/password";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getUser, setUserPassword, updateUser } from "~/lib/server/user";
import { getServerSupabase } from "~/lib/supabaseServer";
import { env } from "../env/env.mjs";
import { Email } from "../server/email";
import { invalidateTokensForUser } from "../server/token";
import { formatSupabaseError } from "../supabase";
import { getLoginData } from "./loginData";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

type LoginUser = Prettify<
	Omit<Users, "orcid" | "avatar"> & {
		memberships: (Members & { community: Communities | null })[];
	}
>;

const getUserWithPasswordHash = async (props: Parameters<typeof getUser>[0]) =>
	getUser(props).select("users.passwordHash").executeTakeFirst();

function redirectUser(memberships?: (Members & { community: Communities | null })[]): never {
	if (!memberships?.length) {
		redirect("/settings");
	}

	redirect(`/c/${memberships[0].community?.slug}/stages`);
}

const clearSupabaseCookies = () => {
	cookies().delete(TOKEN_NAME);
	cookies().delete(REFRESH_NAME);
	cookies().delete("sb-access-token");
	cookies().delete("sb-refresh-token");
};

async function supabaseLogin({ user, password }: { user: LoginUser; password: string }) {
	const supabase = getServerSupabase();

	const { data } = await supabase.auth.signInWithPassword({ email: user.email, password });

	if (!data.session) {
		return {
			error: "Incorrect email or password",
		};
	}

	cookies().set(TOKEN_NAME, data.session?.access_token, {
		path: "/",
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		maxAge: 100 * 365 * 24 * 60 * 60, // 100 years, never expires
	});
	cookies().set(REFRESH_NAME, data.session?.refresh_token, {
		path: "/",
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		maxAge: 100 * 365 * 24 * 60 * 60, // 100 years, never expires
	});

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
	const session = await lucia.createSession(user.id, { type: AuthTokenType.generic });
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	// for good measure, delete the supabse cookies too
	cookies().delete(TOKEN_NAME);
	cookies().delete(REFRESH_NAME);

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

	const user = await getUser({ email }).select("users.passwordHash").executeTakeFirst();

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

	// handle supabase logout on the client,
	// bc it won't listen otherwise

	return {
		success: true,
	};
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

	// for good measure, delete the supabse cookies too
	// might not work
	clearSupabaseCookies();

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

async function supabaseSendForgotPasswordMail(props: { email: string }) {
	const supabase = getServerSupabase();

	const { error } = await supabase.auth.resetPasswordForEmail(props.email, {
		redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
	});

	if (error) {
		return { error: formatSupabaseError(error) };
	}

	return {
		sucess: true,
		report: "Password reset email sent!",
	};
}

async function luciaSendForgotPasswordMail(props: {
	user: NonNullable<Awaited<ReturnType<typeof getUserWithPasswordHash>>>;
}) {
	const result = await Email.passwordReset({
		id: props.user.id,
		email: props.user.email,
		firstName: props.user.firstName,
		lastName: props.user.lastName,
	}).send();

	if ("error" in result) {
		return {
			error: result.error,
		};
	}

	return {
		success: true,
		report: result.report ?? "Password reset email sent!",
	};
}

export const sendForgotPasswordMail = defineServerAction(
	async function sendForgotPasswordMail(props: { email: string }) {
		const user = await getUserWithPasswordHash({ email: props.email });

		if (!user) {
			return {
				success: true,
				report: "Password reset email sent!",
			};
		}

		if (user?.passwordHash === null) {
			return supabaseSendForgotPasswordMail(props);
		}

		return luciaSendForgotPasswordMail({ user });
	}
);

async function supabaseResetPassword({
	user,
	password,
}: {
	user: NonNullable<Awaited<ReturnType<typeof getUserWithPasswordHash>>>;
	password: string;
}) {
	const supabase = getServerSupabase();

	const { data, error } = await supabase.auth.admin.updateUserById(user.supabaseId!, {
		password,
	});

	if (error) {
		const formattedError =
			error.name === "AuthSessionMissingError"
				? "This reset link is invalid or has expired. Please request a new one."
				: formatSupabaseError(error);

		return {
			error: formattedError,
		};
	}

	return {
		success: true,
	};
}

async function luciaResetPassword({
	user,
	password,
}: {
	user: NonNullable<Awaited<ReturnType<typeof getUserWithPasswordHash>>>;
	password: string;
}) {
	await setUserPassword({ userId: user.id, password });

	// clear all password reset tokens
	// TODO: maybe others as well?
	await invalidateTokensForUser(user.id, [AuthTokenType.passwordReset]);

	// clear all sessions, including the current password reset session
	await lucia.invalidateUserSessions(user.id);

	return { success: true };
}

const newPasswordSchema = z.object({
	password: z.string().min(8),
});

export const resetPassword = defineServerAction(async function resetPassword({
	password,
}: {
	password: string;
}) {
	const parsed = newPasswordSchema.safeParse({ password });

	if (parsed.error) {
		return {
			error: "Invalid password",
		};
	}

	const { user } = await getLoginData({
		allowedSessions: [AuthTokenType.passwordReset],
	});

	if (!user) {
		return {
			error: "The password reset link is invalid or has expired. Please request a new one.",
		};
	}

	const fullUser = await getUserWithPasswordHash({ email: user.email });

	if (!fullUser) {
		return {
			error: "Something went wrong. Please request a new password reset link.",
		};
	}

	if (!isLuciaUser(fullUser)) {
		return supabaseResetPassword({ user: fullUser, password: parsed.data.password });
	}

	return luciaResetPassword({ user: fullUser, password: parsed.data.password });
});

export const signup = defineServerAction(async function signup(props: {
	id: UsersId;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}) {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (!user) {
		captureException(new Error("User tried to signup without existing"), {
			user: {
				id: props.id,
				firstName: props.firstName,
				lastName: props.lastName,
				email: props.email,
			},
		});
		return {
			error: "Something went wrong. Please try again later.",
		};
	}

	if (user.id !== props.id) {
		captureException(new Error("User tried to signup with a different id"), {
			user: {
				id: props.id,
				firstName: props.firstName,
				lastName: props.lastName,
				email: props.email,
			},
		});
		return {
			error: "Something went wrong. Please try again later.",
		};
	}

	const trx = db.transaction();

	const result = await trx.execute(async (trx) => {
		const newUser = await updateUser(
			{
				id: props.id,
				firstName: props.firstName,
				lastName: props.lastName,
				email: props.email,
			},
			trx
		);

		await setUserPassword(
			{
				userId: props.id,
				password: props.password,
			},
			trx
		);

		if (newUser.email !== user.email) {
			return { ...newUser, needsVerification: true };
			// TODO: send email verification
		}

		return newUser;
	});

	if ("needsVerification" in result && result.needsVerification) {
		return {
			success: true,
			report: "Please check your email to verify your account!",
			needsVerification: true,
		};
	}

	// log them in

	const [invalidatedSessions, invalidatedTokens] = await Promise.all([
		lucia.invalidateUserSessions(user.id),
		invalidateTokensForUser(user.id, [AuthTokenType.signup]),
	]);

	// lucia authentication
	const newSession = await lucia.createSession(user.id, { type: AuthTokenType.generic });
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	// for good measure, delete the supabse cookies too
	cookies().delete(TOKEN_NAME);
	cookies().delete(REFRESH_NAME);

	return {
		success: true,
		report: "Account created!",
	};
});
