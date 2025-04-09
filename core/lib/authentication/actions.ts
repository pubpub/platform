"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { captureException } from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import type { Communities, CommunitiesId, CommunityMemberships, Users, UsersId } from "db/public";
import { AuthTokenType, MemberRole } from "db/public";
import { logger } from "logger";

import type { Prettify, XOR } from "../types";
import type { SafeUser } from "~/lib/server/user";
import { compiledSignupFormSchema } from "~/app/components/Signup/schema";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { lucia, validateRequest } from "~/lib/authentication/lucia";
import { createPasswordHash, validatePassword } from "~/lib/authentication/password";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	addUser,
	generateUserSlug,
	getUser,
	publicSignupsAllowed,
	setUserPassword,
	updateUser,
} from "~/lib/server/user";
import { LAST_VISITED_COOKIE } from "../../app/components/LastVisitedCommunity/constants";
import { findCommunityBySlug } from "../server/community";
import * as Email from "../server/email";
import { insertCommunityMember, selectCommunityMember } from "../server/member";
import { invalidateTokensForUser } from "../server/token";
import { isClientExceptionOptions } from "../serverActions";
import { SignupErrors } from "./errors";
import { getLoginData } from "./loginData";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

type LoginUser = Prettify<
	Omit<Users, "orcid" | "avatar"> & {
		memberships: (CommunityMemberships & { community: Communities | null })[];
	}
>;

const getUserWithPasswordHash = async (props: Parameters<typeof getUser>[0]) =>
	getUser(props).select("users.passwordHash").executeTakeFirst();

async function redirectUser(
	memberships?: (Omit<CommunityMemberships, "memberGroupId"> & {
		community: Communities | null;
	})[]
): Promise<never> {
	if (!memberships?.length) {
		redirect("/settings");
	}
	const cookieStore = await cookies();
	const lastVisited = cookieStore.get(LAST_VISITED_COOKIE);
	const communitySlug = lastVisited?.value ?? memberships[0].community?.slug;

	redirect(`/c/${communitySlug}/stages`);
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
	(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	if (props.redirectTo && /^\/\w+/.test(props.redirectTo)) {
		redirect(props.redirectTo);
	}

	await redirectUser(user.memberships);
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
	(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

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

const addUserToCommunity = defineServerAction(async function addUserToCommunity(props: {
	userId: UsersId;
	communityId: CommunitiesId;
	/**
	 * @default MemberRole.contributor
	 */
	role?: MemberRole;
}) {
	const existingMembership = await selectCommunityMember({
		userId: props.userId,
		communityId: props.communityId,
	}).executeTakeFirst();

	if (existingMembership) {
		return {
			error: "User already in community",
		};
	}

	const newMembership = await insertCommunityMember({
		userId: props.userId,
		communityId: props.communityId,
		role: props.role ?? MemberRole.contributor,
	}).executeTakeFirstOrThrow();

	return {
		success: true,
		report: "User added to community",
	};
});

/**
 * When a user joins a community by signing up
 */
export const publicJoinCommunity = defineServerAction(async function joinCommunity() {
	const [{ user }, community] = await Promise.all([
		await getLoginData(),
		await findCommunityBySlug(),
	]);

	// TODO: base this off the invite token
	const toBeGrantedRole = MemberRole.contributor;

	if (!community) {
		return SignupErrors.COMMUNITY_NOT_FOUND({ communityName: "unknown" });
	}

	if (!user) {
		return SignupErrors.NOT_LOGGED_IN({ communityName: community.name });
	}

	if (user.memberships.some((m) => m.communityId === community.id)) {
		return SignupErrors.ALREADY_MEMBER({ communityName: community.name });
	}

	const isAllowedSignup = await publicSignupsAllowed(community.id);

	if (!isAllowedSignup) {
		return SignupErrors.NOT_ALLOWED({ communityName: community.name });
	}

	const member = await insertCommunityMember({
		userId: user.id,
		communityId: community.id,
		role: toBeGrantedRole,
	}).executeTakeFirstOrThrow();

	// don't redirect, better to do it client side, better ux
	return {
		success: true,
		report: `You have joined ${community.name}`,
	};
});

export const publicSignup = defineServerAction(async function signup(props: {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	redirectTo?: string;
	slug?: string;
}) {
	const community = await findCommunityBySlug();
	if (!community) {
		return SignupErrors.COMMUNITY_NOT_FOUND({ communityName: "unknown" });
	}

	const [isAllowedSignup, { user }] = await Promise.all([
		publicSignupsAllowed(community.id),
		getLoginData(),
	]);

	if (user) {
		redirect(`/c/${community.slug}/public/join?redirectTo=${props.redirectTo}`);
	}

	if (!isAllowedSignup) {
		return SignupErrors.NOT_ALLOWED({ communityName: community.name });
	}

	const input = {
		firstName: props.firstName,
		lastName: props.lastName,
		email: props.email,
		password: props.password,
	};

	const checked = compiledSignupFormSchema.Errors(input);
	const firstError = checked.First();

	if (firstError) {
		return {
			title: "Invalid signup",
			error: `${firstError.message} for ${firstError.path}`,
		};
	}

	const trx = db.transaction();

	const newUser = await trx.execute(async (trx) => {
		try {
			const newUser = await addUser(
				{
					firstName: props.firstName,
					lastName: props.lastName,
					email: props.email,
					slug:
						props.slug ??
						generateUserSlug({ firstName: props.firstName, lastName: props.lastName }),
					passwordHash: await createPasswordHash(props.password),
				},
				trx
			).executeTakeFirstOrThrow((err) => {
				Sentry.captureException(err);
				return new Error(
					`Unable to create user for public signup with email ${props.email}`
				);
			});

			// TODO: add to community
			const newMember = await insertCommunityMember(
				{
					userId: newUser.id,
					communityId: community.id,
					role: MemberRole.contributor,
				},
				trx
			).executeTakeFirstOrThrow();

			// TODO: send verification email
			return { ...newUser, needsVerification: false };
		} catch (e) {
			if (isUniqueConstraintError(e) && e.table === "users") {
				return SignupErrors.EMAIL_ALREADY_EXISTS({ email: props.email });
			}
			logger.error({ msg: e });
			Sentry.captureException(e);
			throw e;
		}
	});

	if ("error" in newUser) {
		return newUser;
	}

	if ("needsVerification" in newUser && newUser.needsVerification) {
		return {
			success: true,
			report: "Please check your email to verify your account!",
			needsVerification: true,
		};
	}

	// log them in

	// lucia authentication
	const newSession = await lucia.createSession(newUser.id, { type: AuthTokenType.generic });
	const newSessionCookie = lucia.createSessionCookie(newSession.id);
	(await cookies()).set(
		newSessionCookie.name,
		newSessionCookie.value,
		newSessionCookie.attributes
	);

	if (props.redirectTo) {
		redirect(props.redirectTo);
	}

	await redirectUser();

	// typescript cannot sense Promise<never> not returning
	return "" as never;
});

/**
 * flow for when a user has been invited to a community already
 */
export const legacySignup = defineServerAction(async function signup(
	userId: UsersId,
	props: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
		redirectTo?: string | null;
	}
) {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (!user) {
		captureException(new Error("User tried to signup without existing"), {
			user: {
				id: userId,
				firstName: props.firstName,
				lastName: props.lastName,
				email: props.email,
			},
		});
		return {
			error: "Something went wrong. Please try again later.",
		};
	}

	if (user.id !== userId) {
		captureException(new Error("User tried to signup with a different id"), {
			user: {
				id: userId,
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

	const updatedUser = await trx.execute(async (trx) => {
		const updatedUser = await updateUser(
			{
				id: userId,
				firstName: props.firstName,
				lastName: props.lastName,
				email: props.email,
			},
			trx
		);

		await setUserPassword(
			{
				userId,
				password: props.password,
			},
			trx
		);

		if (updatedUser.email !== user.email) {
			return { ...updatedUser, needsVerification: true };
			// TODO: send email verification
		}

		return {
			...updatedUser,
			needsVerification: false,
		};
	});

	if ("needsVerification" in updatedUser && updatedUser.needsVerification) {
		return {
			success: true,
			report: "Please check your email to verify your account!",
			needsVerification: true,
		};
	}

	// invalidate sessions and tokens
	const [invalidatedSessions, invalidatedTokens] = await Promise.all([
		lucia.invalidateUserSessions(updatedUser.id),
		invalidateTokensForUser(updatedUser.id, [AuthTokenType.signup]),
	]);

	// log them in
	const newSession = await lucia.createSession(updatedUser.id, { type: AuthTokenType.generic });
	const newSessionCookie = lucia.createSessionCookie(newSession.id);
	(await cookies()).set(
		newSessionCookie.name,
		newSessionCookie.value,
		newSessionCookie.attributes
	);

	if (props.redirectTo) {
		redirect(props.redirectTo);
	}
	await redirectUser();

	// typescript cannot sense Promise<never> not returning
	return "" as never;
});

// for invite signup, see the app/c/(public)/[communitySlug]/public/invite/actions.ts
