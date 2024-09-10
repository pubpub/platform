"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import type { Communities, Members, Users, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import type { Prettify } from "../types";
import { db } from "~/kysely/database";
import { lucia, validateRequest } from "~/lib/auth/lucia";
import { validatePassword } from "~/lib/auth/password";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getUser, setUserPassword, updateUser } from "~/lib/server/user";
import * as Email from "../server/email";
import { invalidateTokensForUser } from "../server/token";
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

export const loginWithPassword = defineServerAction(async function loginWithPassword(props: {
	email: string;
	password: string;
	redirectTo: string | null;
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

	if (!user.passwordHash) {
		return {
			// TODO: user has no password hash, either send them a password reset email or something
			error: "Incorrect email or password",
		};
	}
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

	if (props.redirectTo) {
		redirect(props.redirectTo);
	}

	redirectUser(user.memberships);
});

export const logout = defineServerAction(async function logout() {
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
});

export const sendForgotPasswordMail = defineServerAction(
	async function sendForgotPasswordMail(props: { email: string }) {
		const user = await getUserWithPasswordHash({ email: props.email });

		if (!user) {
			return {
				success: true,
				report: "Password reset email sent!",
			};
		}

		const result = await Email.passwordReset({
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
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
);

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

	await setUserPassword({ userId: user.id, password });

	// clear all password reset tokens
	// TODO: maybe others as well?
	await invalidateTokensForUser(user.id, [AuthTokenType.passwordReset]);

	// clear all sessions, including the current password reset session
	await lucia.invalidateUserSessions(user.id);

	return { success: true };
});

export const signup = defineServerAction(async function signup(props: {
	id: UsersId;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	redirect: string | null;
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
	const newSessionCookie = lucia.createSessionCookie(newSession.id);
	cookies().set(newSessionCookie.name, newSessionCookie.value, newSessionCookie.attributes);

	if (props.redirect) {
		redirect(props.redirect);
	}
	redirectUser();
});
